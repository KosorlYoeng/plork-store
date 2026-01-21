// Helper Utility Functions

const Helpers = {
  // Show alert message
  showAlert(elementId, message, type = "error") {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;

    alertEl.textContent = message;
    alertEl.className = `alert alert-${type}`;
    alertEl.style.display = "block";

    setTimeout(() => {
      alertEl.style.display = "none";
    }, 5000);
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  },

  // Format date
  formatDate(dateString) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  },

  // Format relative time
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  },

  // Validate email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password
  validatePassword(password) {
    return password.length >= 8;
  },

  // Show/hide password
  togglePasswordVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (input.type === "password") {
      input.type = "text";
      button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2.5 2.5L17.5 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 10.3456 7.5741 10.6738 7.70739 10.9713" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            `;
    } else {
      input.type = "password";
      button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M1.66675 10C1.66675 10 4.16675 4.16667 10.0001 4.16667C15.8334 4.16667 18.3334 10 18.3334 10C18.3334 10 15.8334 15.8333 10.0001 15.8333C4.16675 15.8333 1.66675 10 1.66675 10Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            `;
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show loading state on button
  setButtonLoading(buttonId, loading = true) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const textEl = btn.querySelector(".btn-text");
    const loaderEl = btn.querySelector(".btn-loader");

    if (loading) {
      btn.disabled = true;
      if (textEl) textEl.style.display = "none";
      if (loaderEl) loaderEl.style.display = "flex";
    } else {
      btn.disabled = false;
      if (textEl) textEl.style.display = "block";
      if (loaderEl) loaderEl.style.display = "none";
    }
  },

  // Truncate text
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },

  // Generate initials from name
  getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  },

  // Upload image to Supabase Storage
  async uploadImage(file, bucket = "products") {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }
  },

  // Confirm dialog
  confirm(message) {
    return window.confirm(message);
  },
};

// Export for global use
window.Helpers = Helpers;
