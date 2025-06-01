document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('send-notifications-form');
    const notificationTypeSelect = form.querySelector('[name="notification_type"]');
    const messageTemplate = document.getElementById('message-template');
    
    // Set default billing period to current month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    form.querySelector('[name="billing_period"]').value = `${year}-${month}`;
    
    // Message templates
    const templates = {
        bill: "Dear [Consumer Name],\n\nYour water bill for [Month Year] is ₱[Amount].\nDue date: [Due Date].\n\nPlease pay on time to avoid disconnection.",
        reminder: "Dear [Consumer Name],\n\nThis is a reminder that your water bill of ₱[Amount] is due on [Due Date].\nPlease settle your bill to avoid disconnection.",
        disconnection: "Dear [Consumer Name],\n\nYour water bill of ₱[Amount] is overdue.\nPlease settle immediately to avoid disconnection of water service."
    };
    
    // Update message preview when notification type changes
    function updateMessagePreview() {
        const template = templates[notificationTypeSelect.value];
        messageTemplate.textContent = template;
    }
    
    notificationTypeSelect.addEventListener('change', updateMessagePreview);
    updateMessagePreview(); // Show initial preview
    
    // Form validation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showAlert('Are you sure you want to send notifications to all consumers with unpaid bills for the selected period?', 'warning');
        // Continue with form submission
        this.submit();
    });
});