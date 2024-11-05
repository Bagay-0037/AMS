document.getElementById('changePasswordForm').addEventListener('submit', function(event) {
    const currentPassword = document.getElementById('currentPassword').value.trim(); // Current password
    const newPassword = document.getElementById('newPassword').value.trim(); // Trim whitespace
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

    // Password validation regex
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,}$/;

    // Check if the new password meets the criteria
    if (!passwordRegex.test(newPassword)) {
        event.preventDefault(); // Prevent form submission
        alert('New password must be at least 12 characters long and include uppercase letters, lowercase letters, numbers, and special characters.');
        return; // Exit the function
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmNewPassword) {
        event.preventDefault(); // Prevent form submission
        alert('New passwords do not match.');
    }
});