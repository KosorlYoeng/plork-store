// Login Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const user = await Auth.getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Elements
    const loginForm = document.getElementById('loginForm');
    const discordLoginBtn = document.getElementById('discordLoginBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Discord Login
    if (discordLoginBtn) {
        discordLoginBtn.addEventListener('click', async () => {
            const result = await Auth.loginWithDiscord();
            if (!result.success) {
                Helpers.showAlert('alert', result.error, 'error');
            }
        });
    }

    // Toggle Password Visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            Helpers.togglePasswordVisibility('password', 'togglePassword');
        });
    }

    // Handle Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validation
            if (!Helpers.validateEmail(email)) {
                Helpers.showAlert('alert', 'Please enter a valid email address', 'error');
                return;
            }

            if (!password) {
                Helpers.showAlert('alert', 'Please enter your password', 'error');
                return;
            }

            // Show loading
            Helpers.setButtonLoading('submitBtn', true);

            // Attempt login
            const result = await Auth.login(email, password);

            Helpers.setButtonLoading('submitBtn', false);

            if (result.success) {
                Helpers.showAlert('alert', 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                Helpers.showAlert('alert', result.error, 'error');
            }
        });
    }
});
