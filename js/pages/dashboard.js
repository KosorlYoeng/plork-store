// Dashboard Page JavaScript

let currentUser = null;
let myProducts = [];
let uploadedImages = [];
let productToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Protect page - require authentication
    currentUser = await Auth.protectPage();
    if (!currentUser) return;

    // Check if seller is approved
    if (currentUser.profile.role === 'seller' && currentUser.profile.status !== 'approved') {
        alert('Your seller account is pending approval. Please wait for admin approval.');
        window.location.href = 'index.html';
        return;
    }

    // Show admin link if user is admin
    if (currentUser.profile.role === 'admin') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'block';
    }

    // Initialize
    initializeDashboard();
    setupEventListeners();
    loadMyProducts();
});

function initializeDashboard() {
    // Set welcome name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        welcomeName.textContent = currentUser.profile.first_name;
    }

    // Set user role
    const userRoleText = document.getElementById('userRoleText');
    if (userRoleText) {
        userRoleText.textContent = currentUser.profile.role.charAt(0).toUpperCase() + 
                                   currentUser.profile.role.slice(1);
    }

    // Load settings
    loadSettings();
}

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Image upload
    const productImages = document.getElementById('productImages');
    if (productImages) {
        productImages.addEventListener('change', handleImageUpload);
    }

    // Search and filters
    const searchProducts = document.getElementById('searchProducts');
    if (searchProducts) {
        searchProducts.addEventListener('input', Helpers.debounce(filterProducts, 300));
    }

    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', filterProducts);
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', filterProducts);
    }
}

function showSection(sectionId) {
    // Update sidebar active state
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

// Load user's products
async function loadMyProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('seller_id', currentUser.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        myProducts = data || [];
        renderMyProducts(myProducts);
        updateStats();
        renderRecentProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        Helpers.showAlert('productAlert', 'Error loading products: ' + error.message, 'error');
    }
}

function renderMyProducts(products) {
    const grid = document.getElementById('myProductsGrid');
    const emptyState = document.getElementById('productsEmptyState');

    if (!products || products.length === 0) {
        if (grid) grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) {
        grid.innerHTML = products.map(product => createDashboardProductCard(product)).join('');
    }
}

function createDashboardProductCard(product) {
    const images = product.images || [];
    const imageUrl = images.length > 0 ? images[0] : '';

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
                    Qty: ${product.quantity} | Created: ${Helpers.formatRelativeTime(product.created_at)}
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="editProduct('${product.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct('${product.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = myProducts.length;
    const available = myProducts.filter(p => p.status === 'available').length;
    const soldOut = myProducts.filter(p => p.status === 'soldout').length;
    const totalValue = myProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    document.getElementById('totalProductsStat').textContent = total;
    document.getElementById('availableProductsStat').textContent = available;
    document.getElementById('soldOutProductsStat').textContent = soldOut;
    document.getElementById('totalValueStat').textContent = Helpers.formatCurrency(totalValue);
}

function renderRecentProducts() {
    const tbody = document.getElementById('recentProductsTable');
    const recent = myProducts.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No products yet</td></tr>';
        return;
    }

    tbody.innerHTML = recent.map(product => `
        <tr>
            <td><strong>${product.name}</strong></td>
            <td>${product.category}</td>
            <td>${Helpers.formatCurrency(product.price)}</td>
            <td>${product.quantity}</td>
            <td><span class="status-badge status-${product.status}">${product.status}</span></td>
        </tr>
    `).join('');
}

// Filter products
function filterProducts() {
    const search = document.getElementById('searchProducts')?.value.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    let filtered = myProducts;

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

    renderMyProducts(filtered);
}

// Handle image upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 5) {
        alert('Maximum 5 images allowed');
        return;
    }

    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImages.push({
                file: file,
                preview: event.target.result
            });
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    const grid = document.getElementById('imagePreviewGrid');
    grid.innerHTML = uploadedImages.map((img, index) => `
        <div class="image-preview-item">
            <img src="${img.preview}" alt="Preview ${index + 1}">
            <button type="button" class="image-preview-remove" onclick="removeImage(${index})">×</button>
        </div>
    `).join('');
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
}

// Handle product form submit
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('editProductId')?.value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const status = document.getElementById('productStatus').value;

    if (!name || !category || !description || price < 0 || quantity < 0) {
        Helpers.showAlert('productAlert', 'Please fill in all fields correctly', 'error');
        return;
    }

    Helpers.setButtonLoading('productSubmitBtn', true);

    try {
        // Upload images to Supabase Storage
        let imageUrls = [];
        for (const img of uploadedImages) {
            const result = await Helpers.uploadImage(img.file, 'products');
            if (result.success) {
                imageUrls.push(result.url);
            }
        }

        const productData = {
            name,
            category,
            description,
            price,
            quantity,
            status,
            images: imageUrls,
            seller_id: currentUser.user.id
        };

        let result;
        if (productId) {
            // Update existing product
            result = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', productId)
                .eq('seller_id', currentUser.user.id);
        } else {
            // Create new product
            result = await supabaseClient
                .from('products')
                .insert([productData]);
        }

        if (result.error) throw result.error;

        Helpers.showAlert('productAlert', 
            `Product ${productId ? 'updated' : 'created'} successfully!`, 
            'success');
        
        setTimeout(() => {
            cancelProductForm();
            loadMyProducts();
            showSection('products');
        }, 1500);

    } catch (error) {
        console.error('Error saving product:', error);
        Helpers.showAlert('productAlert', 'Error saving product: ' + error.message, 'error');
    } finally {
        Helpers.setButtonLoading('productSubmitBtn', false);
    }
}

// Edit product
async function editProduct(productId) {
    const product = myProducts.find(p => p.id === productId);
    if (!product) return;

    // Fill form
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productStatus').value = product.status;

    // Load existing images
    uploadedImages = (product.images || []).map(url => ({
        file: null,
        preview: url,
        existing: true
    }));
    renderImagePreviews();

    // Update UI
    document.getElementById('productFormTitle').textContent = 'Edit Product';
    document.querySelector('#productSubmitBtn .btn-text').textContent = 'Update Product';
    showSection('create-product');
}

// Cancel product form
function cancelProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    uploadedImages = [];
    renderImagePreviews();
    document.getElementById('productFormTitle').textContent = 'Create New Product';
    document.querySelector('#productSubmitBtn .btn-text').textContent = 'Create Product';
    document.getElementById('productAlert').style.display = 'none';
}

// Delete product
function confirmDeleteProduct(productId) {
    productToDelete = productId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('deleteModal').classList.remove('active');
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!productToDelete) return;

    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productToDelete)
            .eq('seller_id', currentUser.user.id);

        if (error) throw error;

        closeDeleteModal();
        loadMyProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
});

// Load settings
function loadSettings() {
    if (currentUser?.profile) {
        document.getElementById('settingsFirstName').value = currentUser.profile.first_name;
        document.getElementById('settingsLastName').value = currentUser.profile.last_name;
        document.getElementById('settingsUsername').value = currentUser.profile.username;
        document.getElementById('settingsPhone').value = currentUser.profile.phone;
        document.getElementById('settingsRole').value = currentUser.profile.role;
        
        const statusBadge = document.getElementById('settingsStatus');
        statusBadge.textContent = currentUser.profile.status;
        statusBadge.className = `status-badge status-${currentUser.profile.status}`;
    }
}

// Make functions global
window.showSection = showSection;
window.editProduct = editProduct;
window.confirmDeleteProduct = confirmDeleteProduct;
window.closeDeleteModal = closeDeleteModal;
window.cancelProductForm = cancelProductForm;
window.removeImage = removeImage;
