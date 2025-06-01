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