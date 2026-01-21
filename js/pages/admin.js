// Admin Panel JavaScript

let currentUser = null;
let allSellers = [];
let allProducts = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Protect page - admin only
    currentUser = await Auth.protectAdminPage();
    if (!currentUser) return;

    // Initialize
    setupEventListeners();
    loadAllData();
});

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    // Search and filters
    const searchSellers = document.getElementById('searchSellers');
    if (searchSellers) {
        searchSellers.addEventListener('input', Helpers.debounce(filterSellers, 300));
    }

    const filterSellerStatus = document.getElementById('filterSellerStatus');
    if (filterSellerStatus) {
        filterSellerStatus.addEventListener('change', filterSellers);
    }

    const searchProducts = document.getElementById('searchProducts');
    if (searchProducts) {
        searchProducts.addEventListener('input', Helpers.debounce(filterProducts, 300));
    }

    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', filterProducts);
    }

    const filterProductStatus = document.getElementById('filterProductStatus');
    if (filterProductStatus) {
        filterProductStatus.addEventListener('change', filterProducts);
    }

    const searchUsers = document.getElementById('searchUsers');
    if (searchUsers) {
        searchUsers.addEventListener('input', Helpers.debounce(filterUsers, 300));
    }

    const filterUserRole = document.getElementById('filterUserRole');
    if (filterUserRole) {
        filterUserRole.addEventListener('change', filterUsers);
    }
}

function showSection(sectionId) {
    // Update sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

    // Show section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId)?.classList.add('active');
}

// Load all data
async function loadAllData() {
    await Promise.all([
        loadSellers(),
        loadAllProducts(),
        loadAllUsers(),
        updateStats()
    ]);
}

// Load sellers
async function loadSellers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*, products:products(count)')
            .eq('role', 'seller')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allSellers = data || [];
        renderSellers(allSellers);
        renderPendingSellers();
    } catch (error) {
        console.error('Error loading sellers:', error);
    }
}

function renderPendingSellers() {
    const tbody = document.getElementById('pendingSellersTable');
    const pending = allSellers.filter(s => s.status === 'pending');
    
    document.getElementById('pendingCount').textContent = pending.length;

    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No pending approvals</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(seller => `
        <tr>
            <td><strong>${seller.first_name} ${seller.last_name}</strong></td>
            <td>${seller.username}</td>
            <td>${seller.phone}</td>
            <td>${Helpers.formatRelativeTime(seller.created_at)}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-success btn-sm" onclick="updateSellerStatus('${seller.id}', 'approved')">
                        ✅ Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="updateSellerStatus('${seller.id}', 'rejected')">
                        ❌ Reject
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderSellers(sellers) {
    const tbody = document.getElementById('sellersTable');
    
    if (sellers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No sellers found</td></tr>';
        return;
    }

    tbody.innerHTML = sellers.map(seller => {
        const productCount = seller.products?.[0]?.count || 0;
        return `
            <tr>
                <td><strong>${seller.first_name} ${seller.last_name}</strong></td>
                <td>${seller.username}</td>
                <td>${seller.phone}</td>
                <td>${productCount}</td>
                <td><span class="status-badge status-${seller.status}">${seller.status}</span></td>
                <td>
                    <select class="filter-select" onchange="updateSellerStatus('${seller.id}', this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">
                        <option value="pending" ${seller.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${seller.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${seller.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="suspended" ${seller.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

function filterSellers() {
    const search = document.getElementById('searchSellers')?.value.toLowerCase() || '';
    const status = document.getElementById('filterSellerStatus')?.value || '';

    let filtered = allSellers;

    if (search) {
        filtered = filtered.filter(s => 
            s.first_name.toLowerCase().includes(search) ||
            s.last_name.toLowerCase().includes(search) ||
            s.username.toLowerCase().includes(search) ||
            s.phone.includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(s => s.status === status);
    }

    renderSellers(filtered);
}

// Update seller status
async function updateSellerStatus(sellerId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ status: newStatus })
            .eq('id', sellerId);

        if (error) throw error;

        alert(`Seller ${newStatus} successfully!`);
        loadSellers();
        updateStats();
    } catch (error) {
        console.error('Error updating seller status:', error);
        alert('Error updating seller status: ' + error.message);
    }
}

// Load all products
async function loadAllProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select(`
                *,
                seller:users(first_name, last_name, username)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data || [];
        renderAllProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderAllProducts(products) {
    const grid = document.getElementById('allProductsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h3>No products found</h3></div>';
        return;
    }

    grid.innerHTML = products.map(product => createAdminProductCard(product)).join('');
}

function createAdminProductCard(product) {
    const images = product.images || [];
    const imageUrl = images.length > 0 ? images[0] : '';
    const sellerName = product.seller 
        ? `${product.seller.first_name} ${product.seller.last_name}`
        : 'Unknown';

    return `
        <div class="dashboard-product-card">
            ${imageUrl 
                ? `<img src="${imageUrl}" alt="${product.name}" class="product-card-image">`
                : `<div class="product-card-image" style="display: flex; align-items: center; justify-content: center; font-size: 2rem;">📦</div>`
            }
            <div class="product-card-body">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name" style="font-size: 1.125rem;">${product.name}</h3>
                <p class="product-description">${Helpers.truncateText(product.description, 80)}</p>
                <div class="product-footer" style="margin-top: var(--spacing-sm);">
                    <div class="product-price">${Helpers.formatCurrency(product.price)}</div>
                    <span class="status-badge status-${product.status}">
                        ${product.status === 'available' ? 'Available' : 'Sold Out'}
                    </span>
                </div>
                <div style="margin-top: var(--spacing-xs); color: var(--text-secondary); font-size: 0.75rem;">
                    Seller: ${sellerName} | Qty: ${product.quantity}
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function filterProducts() {
    const search = document.getElementById('searchProducts')?.value.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const status = document.getElementById('filterProductStatus')?.value || '';

    let filtered = allProducts;

    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
    }

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    if (status) {
        filtered = filtered.filter(p => p.status === status);
    }

    renderAllProducts(filtered);
}

// Delete product (admin can delete any product)
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        alert('Product deleted successfully!');
        loadAllProducts();
        updateStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Load all users
async function loadAllUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allUsers = data || [];
        renderAllUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderAllUsers(users) {
    const tbody = document.getElementById('usersTable');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.first_name} ${user.last_name}</strong></td>
            <td>${user.username}</td>
            <td>${user.phone}</td>
            <td><span class="status-badge" style="background: #e0e7ff; color: #6366f1;">${user.role}</span></td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>${Helpers.formatDate(user.created_at)}</td>
        </tr>
    `).join('');
}

function filterUsers() {
    const search = document.getElementById('searchUsers')?.value.toLowerCase() || '';
    const role = document.getElementById('filterUserRole')?.value || '';

    let filtered = allUsers;

    if (search) {
        filtered = filtered.filter(u => 
            u.first_name.toLowerCase().includes(search) ||
            u.last_name.toLowerCase().includes(search) ||
            u.username.toLowerCase().includes(search) ||
            u.phone.includes(search)
        );
    }

    if (role) {
        filtered = filtered.filter(u => u.role === role);
    }

    renderAllUsers(filtered);
}

// Update statistics
async function updateStats() {
    try {
        // Total users
        const { count: totalUsers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Active sellers
        const { count: activeSellers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'seller')
            .eq('status', 'approved');

        // Pending sellers
        const { count: pendingSellers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'seller')
            .eq('status', 'pending');

        // Total products
        const { count: totalProducts } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact', head: true });

        document.getElementById('totalUsersStat').textContent = totalUsers || 0;
        document.getElementById('activeSellersStat').textContent = activeSellers || 0;
        document.getElementById('pendingSellersStat').textContent = pendingSellers || 0;
        document.getElementById('totalProductsStat').textContent = totalProducts || 0;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Make functions global
window.showSection = showSection;
window.updateSellerStatus = updateSellerStatus;
window.deleteProduct = deleteProduct;
