/* =========================
   GLOBAL STATE & STORAGE
========================= */

const STORAGE_KEYS = {
    PRODUCTS: 'products',
    CONFIG: 'config',
    DISCORD_USER: 'discord_user',
    DISCORD_TOKEN: 'discord_token'
};

const ADMIN_DISCORD_IDS = ['715175664193372171'];

let products = [];
let config = {};
let isAdminMode = false;

/* =========================
   DISCORD OAUTH CONFIG
========================= */

const DISCORD_OAUTH = {
    clientId: '1462789095787855914',
    redirectUri: 'https://plork.store',
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
    checkAdminAccess();
});

/* =========================
   ADMIN ACCESS CONTROL
========================= */

function checkAdminAccess() {
    const settingsBtn = document.querySelector('.settings-toggle');
    const adminBtn = document.getElementById('adminBtn');
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCORD_USER));

    if (settingsBtn) settingsBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';

    if (!user) return;

    if (ADMIN_DISCORD_IDS.includes(user.id)) {
        if (settingsBtn) settingsBtn.style.display = 'inline-flex';
        if (adminBtn) adminBtn.style.display = 'inline-flex';
        isAdminMode = true;
    }
}

/* =========================
   UI BINDINGS
========================= */

function bindUI() {
    document.querySelector('.settings-toggle')
        ?.addEventListener('click', openSettings);

    document.getElementById('productForm')
        ?.addEventListener('submit', handleProductSubmit);
}

/* =========================
   SETTINGS MODAL
========================= */

function openSettings() {
    if (!isAdminMode) {
        notify('Access denied', true);
        return;
    }
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    config = {
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

    document.getElementById('discordEnabled').checked = config.discordWebhook?.enabled || false;
    document.getElementById('discordWebhook').value = config.discordWebhook?.url || '';
    document.getElementById('telegramEnabled').checked = config.telegram?.enabled || false;
    document.getElementById('telegramBotToken').value = config.telegram?.botToken || '';
    document.getElementById('telegramChatId').value = config.telegram?.chatId || '';
}

function loadProducts() {
    products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
}

/* =========================
   PRODUCTS
========================= */

function handleProductSubmit(e) {
    e.preventDefault();
    if (!isAdminMode) return notify('Admin only', true);

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
    grid.innerHTML = '';

    if (!products.length) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    products.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${p.image || ''}" onerror="this.style.display='none'">
                <div class="product-content">
                    <span class="product-category">${p.category}</span>
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div class="product-footer">
                        <span class="price">$${p.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

/* =========================
   IMAGE PREVIEW
========================= */

function setupImagePreview() {
    productImage?.addEventListener('input', () => {
        imagePreview.innerHTML = productImage.value
            ? `<img src="${productImage.value}" onerror="this.remove()">`
            : `<div class="image-preview-placeholder">📦</div>`;
    });
}

/* =========================
   NOTIFICATIONS
========================= */

function notify(msg, error = false) {
    const n = document.createElement('div');
    n.className = `notification${error ? ' error' : ''}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

/* =========================
   DISCORD LOGIN (PKCE)
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

    location.href = `https://discord.com/oauth2/authorize?${params}`;
}

function handleDiscordCallback() {
    const qs = new URLSearchParams(location.search);
    const code = qs.get('code');
    const state = qs.get('state');
    if (!code) return;

    if (state !== sessionStorage.getItem('discord_state')) return;
    exchangeDiscordCode(code, sessionStorage.getItem('discord_verifier'));
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
    fetchDiscordUser(token.access_token);
}

async function fetchDiscordUser(token) {
    const res = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
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
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = user.username;
    userAvatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    checkAdminAccess();
}

/* =========================
   LOGOUT
========================= */

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
}

/* =========================
   PKCE HELPERS
========================= */

function generateCodeVerifier() {
    return crypto.getRandomValues(new Uint8Array(32))
        .reduce((s, b) => s + String.fromCharCode(b), '');
}

async function generateCodeChallenge(v) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    return btoa(String.fromCharCode(...new Uint8Array(d)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
