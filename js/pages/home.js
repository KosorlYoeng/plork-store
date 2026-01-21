// Home Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('productsGrid');
    const productsLoading = document.getElementById('productsLoading');
    const emptyState = document.getElementById('emptyState');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalSellersEl = document.getElementById('totalSellers');

    let allProducts = [];

    // Fetch products
    async function fetchProducts() {
        try {
            if (productsLoading) productsLoading.style.display = 'block';
            if (productsGrid) productsGrid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'none';

            const { data, error } = await supabaseClient
                .from('products')
                .select(`
                    *,
                    seller:users(first_name, last_name, username)
                `)
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            if (error) throw error;

            allProducts = data || [];
            renderProducts(allProducts);
            updateStats();

        } catch (error) {
            console.error('Error fetching products:', error);
            if (productsLoading) productsLoading.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <div class="empty-icon">⚠️</div>
                    <h3>Error loading products</h3>
                    <p>${error.message}</p>
                `;
            }
        }
    }

    // Render products
    function renderProducts(products) {
        if (productsLoading) productsLoading.style.display = 'none';

        if (!products || products.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (productsGrid) productsGrid.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (productsGrid) {
            productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
        }
    }

    // Create product card HTML
    function createProductCard(product) {
        const images = product.images || [];
        const imageUrl = images.length > 0 ? images[0] : '';
        const sellerName = product.seller 
            ? `${product.seller.first_name} ${product.seller.last_name}`
            : 'Unknown Seller';

        return `
            <div class="product-card">
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="${product.name}" class="product-image">`
                    : `<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: var(--gray-100); font-size: 3rem;">📦</div>`
                }
                <div class="product-info">
                    <div class="product-category">${product.category || 'Uncategorized'}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${Helpers.truncateText(product.description, 100)}</p>
                    <div class="product-footer">
                        <div>
                            <div class="product-price">${Helpers.formatCurrency(product.price)}</div>
                            <div class="product-quantity">Qty: ${product.quantity}</div>
                        </div>
                        <span class="status-badge status-${product.status}">
                            ${product.status === 'available' ? 'Available' : 'Sold Out'}
                        </span>
                    </div>
                    <div style="margin-top: var(--spacing-sm); color: var(--text-secondary); font-size: 0.75rem;">
                        By ${sellerName}
                    </div>
                </div>
            </div>
        `;
    }

    // Filter products
    function filterProducts() {
        const category = categoryFilter ? categoryFilter.value : '';
        const status = statusFilter ? statusFilter.value : '';

        let filtered = allProducts;

        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        if (status) {
            filtered = filtered.filter(p => p.status === status);
        }

        renderProducts(filtered);
    }

    // Update stats
    async function updateStats() {
        try {
            // Total products
            if (totalProductsEl) {
                totalProductsEl.textContent = allProducts.length;
            }

            // Total sellers
            const { count } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'seller')
                .eq('status', 'approved');

            if (totalSellersEl) {
                totalSellersEl.textContent = count || 0;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Event listeners
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterProducts);
    }

    // Initial load
    await fetchProducts();

    // Real-time subscriptions
    const productsSubscription = supabaseClient
        .channel('products-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' },
            () => {
                fetchProducts();
            }
        )
        .subscribe();
});
