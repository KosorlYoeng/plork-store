// Register Page JavaScript

document.addEventListener("DOMContentLoaded", async () => {
  // Check if already logged in
  const user = await Auth.getCurrentUser();
  if (user) {
    window.location.href = "dashboard.html";
    return;
  }

  // Elements
  const registerForm = document.getElementById("registerForm");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const toggleConfirmPasswordBtn = document.getElementById(
    "toggleConfirmPassword",
  );

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      Helpers.togglePasswordVisibility("password", "togglePassword");
    });
  }

  if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener("click", () => {
      Helpers.togglePasswordVisibility(
        "confirmPassword",
        "toggleConfirmPassword",
      );
    });
  }

  // Handle Form Submit
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form values
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const role = document.getElementById("role").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const terms = document.getElementById("terms").checked;

      // Validation
      if (!firstName || !lastName || !username || !email || !role) {
        Helpers.showAlert(
          "alert",
          "Please fill in all required fields",
          "error",
        );
        return;
      }

      if (!Helpers.validateEmail(email)) {
        Helpers.showAlert(
          "alert",
          "Please enter a valid email address",
          "error",
        );
        return;
      }

      if (!Helpers.validatePassword(password)) {
        Helpers.showAlert(
          "alert",
          "Password must be at least 8 characters long",
          "error",
        );
        return;
      }

      if (password !== confirmPassword) {
        Helpers.showAlert("alert", "Passwords do not match", "error");
        return;
      }

      if (!terms) {
        Helpers.showAlert(
          "alert",
          "Please accept the Terms of Service",
          "error",
        );
        return;
      }

      // Show loading
      Helpers.setButtonLoading("submitBtn", true);

      // Attempt registration
      const result = await Auth.register({
        firstName,
        lastName,
        username,
        email,
        password,
        role,
      });

      Helpers.setButtonLoading("submitBtn", false);

      if (result.success) {
        let message = "Account created successfully!";
        if (role === "seller") {
          message +=
            " Your account is pending approval. You will be notified once approved.";
        } else {
          message += " Redirecting to dashboard...";
        }

        Helpers.showAlert("alert", message, "success");

        setTimeout(() => {
          if (role === "seller") {
            window.location.href = "index.html";
          } else {
            window.location.href = "dashboard.html";
          }
        }, 2000);
      } else {
        Helpers.showAlert("alert", result.error, "error");
      }
    });
  }
});
