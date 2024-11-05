function confirmDeleteAccount() {
    const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    
    if (confirmation) {
        // If confirmed, submit the form with 'confirmed' flag set to true
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/delete_account';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'confirmed';
        input.value = 'true';

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();  // Submit the form to trigger account deletion
    }
}
