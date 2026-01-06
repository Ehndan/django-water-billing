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
    
    // Confirmation modal handling
    const confirmModal = document.getElementById('send-confirm-modal');
    const confirmSendBtn = confirmModal ? confirmModal.querySelector('[data-action="confirm-send"]') : null;
    const cancelConfirmBtn = confirmModal ? confirmModal.querySelector('[data-action="cancel-confirm"]') : null;
    const closeConfirmBtn = confirmModal ? confirmModal.querySelector('.modal-close') : null;

    function openConfirmModal() {
        if (!confirmModal) {
            form.submit();
            return;
        }
        confirmModal.classList.add('show');
    }

    function closeConfirmModal() {
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        openConfirmModal();
    });

    if (confirmSendBtn) {
        confirmSendBtn.addEventListener('click', function() {
            closeConfirmModal();
            form.submit();
        });
    }

    [cancelConfirmBtn, closeConfirmBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                closeConfirmModal();
            });
        }
    });

    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                closeConfirmModal();
            }
        });
    }
});