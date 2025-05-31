document.addEventListener('DOMContentLoaded', function() {
    // Convert Django messages to toast notifications
    const messages = document.querySelectorAll('.messages .alert');
    messages.forEach(message => {
        const text = message.textContent.trim();
        const type = message.classList.contains('alert-error') ? 'error' : 
                    Array.from(message.classList)
                         .find(cls => cls.startsWith('alert-'))
                         ?.replace('alert-', '') || 'info';
        
        // Remove original message
        message.remove();
        
        // Show as toast
        showAlert(text, type);
    });
    
    // Remove empty messages container
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer && !messagesContainer.children.length) {
        messagesContainer.remove();
    }
});

function showAlert(message, type = 'success', duration = 3000) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} toast`;
    
    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        case 'error':
        case 'danger':
            icon = 'exclamation-circle';
            break;
        case 'info':
            icon = 'info-circle';
            break;
    }
    
    // Set content with icon
    alertDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <p>${message}</p>
    `;

    // Add to document
    document.body.appendChild(alertDiv);
    
    // Remove after duration
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => alertDiv.remove(), 300);
    }, duration);
}