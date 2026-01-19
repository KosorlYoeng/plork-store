/* =========================
   GLOBAL STATE & STORAGE
========================= */

const STORAGE_KEYS = {
    PRODUCTS: 'products',
    CONFIG: 'config',
    DISCORD_USER: 'discord_user',
    DISCORD_TOKEN: 'discord_token'
};

let products = [];
let config = {};
let isAdminMode = false;

/* =========================
   DISCORD OAUTH CONFIG
========================= */

const DISCORD_OAUTH = {
    clientId: '1462789095787855914',
    redirectUri: 'https://plork.store',
    adminIds: ['715175664193372171'],
    scopes: ['identify']
};

/* =========================
   DOM READY
========================= */

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadProducts();
    renderProducts();
    setupImagePreview();
    bindUI();
    handleDiscordCallback();
    restoreDiscordSession();
});

/* =========================
   UI BINDINGS
========================= */

function bindUI() {
    const settingsBtn = document.querySelector('.settings-toggle');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);

    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', handleProductSubmit);
}

/* =========================
   SETTINGS MODAL
========================= */

function openSettings() {
    document.getElementById('settingsModal')?.classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal')?.classList.remove('active');
}

function saveSettings() {
    config = {
        discordAuth: {
            enabled: document.getElementById('discordAuthEnabled')?.checked || false
        },
        discordWebhook: {
            enabled: document.getElementById('discordEnabled')?.checked || false,
            url: document.getElementById('discordWebhook')?.value || ''
        },
        telegram: {
            enabled: document.getElementById('telegramEnabled')?.checked || false,
            botToken: document.getElementById('telegramBotToken')?.value || '',
            chatId: document.getElementById('telegramChatId')?.value || ''
        }
    };

    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    closeSettings();
    notify('Settings saved');
}

/* =========================
   LOADERS
========================= */

function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!saved) return;

    config = JSON.parse(saved);

    document.getElementById('discordAuthEnabled').checked = config.discordAuth?.enabled || false;
    document.getElementById('discordEnabled').checked = config.discordWebhook?.enabled || false;
    document.getElementById('discordWebhook').value = config.discordWebhook?.url || '';
    document.getElementById('telegramEnabled').checked = config.telegram?.enabled || false;
    document.getElementById('telegramBotToken').value = config.telegram?.botToken || '';
    document.getElementById('telegramChatId').value = config.telegram?.chatId || '';
}

function loadProducts() {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    products = saved ? JSON.parse(saved) : [];
}

/* =========================
   PRODUCTS
========================= */

function handleProductSubmit(e) {
    e.preventDefault();
    if (!isAdminMode) return notify('Admin access required', true);

    const product = {
        id: Date.now(),
        name: productName.value,
        category: productCategory.value,
        description: productDescription.value,
        price: Number(productPrice.value),
        image: productImage.value
    };

    products.push(product);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    renderProducts();
    sendNotifications('Added', product);
    e.target.reset();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    grid.innerHTML = '';

    if (!products.length) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image || ''}" onerror="this.style.display='none'">
            <div class="product-content">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <div class="product-footer">
                    <span class="price">$${p.price.toFixed(2)}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* =========================
   IMAGE PREVIEW
========================= */

function setupImagePreview() {
    const input = document.getElementById('productImage');
    const preview = document.getElementById('imagePreview');
    if (!input || !preview) return;

    input.addEventListener('input', () => {
        preview.innerHTML = input.value
            ? `<img src="${input.value}" onerror="this.remove()">`
            : `<div class="image-preview-placeholder">📦</div>`;
    });
}

/* =========================
   NOTIFICATIONS
========================= */

function notify(msg, error = false) {
    const n = document.createElement('div');
    n.className = 'notification' + (error ? ' error' : '');
    n.textContent = msg;
    document.body.appendChild(n);

    setTimeout(() => {
        n.style.opacity = '0';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

/* =========================
   DISCORD + TELEGRAM
========================= */

function sendNotifications(action, product) {
    if (config.discordWebhook?.enabled) sendDiscord(action, product);
    if (config.telegram?.enabled) sendTelegram(action, product);
}

function sendDiscord(action, product) {
    if (!config.discordWebhook?.url) return;

    fetch(config.discordWebhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: `Product ${action}`,
                fields: [
                    { name: 'Name', value: product.name, inline: true },
                    { name: 'Category', value: product.category, inline: true },
                    { name: 'Price', value: `$${product.price.toFixed(2)}` }
                ]
            }]
        })
    });
}

function sendTelegram(action, product) {
    if (!config.telegram.botToken || !config.telegram.chatId) return;

    fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: config.telegram.chatId,
            text: `Product ${action}\n${product.name} - $${product.price}`
        })
    });
}

/* =========================
   DISCORD OAUTH (PKCE)
========================= */

async function loginWithDiscord() {
    const state = crypto.randomUUID();
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    sessionStorage.setItem('discord_state', state);
    sessionStorage.setItem('discord_verifier', verifier);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: DISCORD_OAUTH.clientId,
        redirect_uri: DISCORD_OAUTH.redirectUri,
        scope: DISCORD_OAUTH.scopes.join(' '),
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });

    window.location.href =
        `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function handleDiscordCallback() {
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get('code');
    const state = qs.get('state');
    if (!code) return;

    const savedState = sessionStorage.getItem('discord_state');
    const verifier = sessionStorage.getItem('discord_verifier');
    if (state !== savedState) return notify('Invalid Discord login', true);

    exchangeDiscordCode(code, verifier);
}

async function exchangeDiscordCode(code, verifier) {
    const body = new URLSearchParams({
        client_id: DISCORD_OAUTH.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_OAUTH.redirectUri,
        code_verifier: verifier
    });

    const res = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    const token = await res.json();
    localStorage.setItem(STORAGE_KEYS.DISCORD_TOKEN, JSON.stringify(token));
    fetchDiscordUser(token.access_token);
}

async function fetchDiscordUser(accessToken) {
    const res = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const user = await res.json();
    localStorage.setItem(STORAGE_KEYS.DISCORD_USER, JSON.stringify(user));
    applyDiscordSession(user);
    history.replaceState({}, document.title, '/');
}

function restoreDiscordSession() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCORD_USER));
    if (user) applyDiscordSession(user);
}

function applyDiscordSession(user) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userAvatar').src =
        `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    if (DISCORD_OAUTH.adminIds.includes(user.id)) {
        document.getElementById('adminBtn').style.display = 'inline-block';
        isAdminMode = true;
        document.body.classList.add('admin-mode');
        notify('Admin access granted');
    }
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
}

/* =========================
   PKCE HELPERS
========================= */

function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
