// Navbar Component JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.getElementById('authButtons');
    const userButton = document.getElementById('userButton');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    // Check authentication status
    const user = await Auth.getCurrentUser();

    if (user && user.profile) {
        // Show user menu
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';

        // Set user info
        if (userAvatar) {
            userAvatar.textContent = Helpers.getInitials(
                user.profile.first_name,
                user.profile.last_name
            );
        }
        if (userName) {
            userName.textContent = user.profile.username;
        }
    } else {
        // Show auth buttons
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }

    // User menu toggle
    if (userButton && dropdownMenu) {
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await Auth.logout();
        });
    }

    // Mobile menu toggle
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Highlight active page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        }
    });
});
