document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss toast notifications after 5 seconds
    const toastAlerts = document.querySelectorAll('.alert.toast');
    toastAlerts.forEach(alert => {
        setTimeout(() => {
            alert.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
});