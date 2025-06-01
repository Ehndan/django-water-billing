// Apply sidebar state immediately before DOM is fully loaded
(function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    if (sidebar && mainContent && localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('collapsed');
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (toggleBtn && sidebar && mainContent) {
        function toggleSidebar() {
            sidebar.classList.toggle('collapsed');
            if (mainContent.classList.contains('with-sidebar')) {
                mainContent.classList.toggle('collapsed');
            }
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }

        toggleBtn.addEventListener('click', toggleSidebar);
    }

    // Confirmation dialogs for critical actions
    document.querySelectorAll('[data-confirm]').forEach(element => {
        element.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // Table search functionality
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.table-container').querySelector('table');
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Sort table columns
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const index = Array.from(this.parentElement.children).indexOf(this);
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            const isAsc = this.classList.contains('asc');

            // Update sort indicators
            table.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
            this.classList.toggle('asc', !isAsc);
            this.classList.toggle('desc', isAsc);

            // Sort rows
            rows.sort((a, b) => {
                const aValue = a.children[index].textContent;
                const bValue = b.children[index].textContent;
                return isAsc ? 
                    bValue.localeCompare(aValue, undefined, {numeric: true}) :
                    aValue.localeCompare(bValue, undefined, {numeric: true});
            });

            // Reorder rows
            rows.forEach(row => table.querySelector('tbody').appendChild(row));
        });
    });

    // Form validation for bill generation
    const billForm = document.getElementById('generate-bill-form');
    const generateBillBtn = document.querySelector('[data-action="generate-bill"]');
    const modalOverlay = document.getElementById('bill-modal-overlay');
    
    if (generateBillBtn && modalOverlay) {
        generateBillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modalOverlay.classList.add('show');
            
            // Set default due date to 30 days from billing period
            const billingPeriodInput = billForm.querySelector('[name="billing_period"]');
            const dueDateInput = billForm.querySelector('[name="due_date"]');
            
            billingPeriodInput.addEventListener('change', function() {
                const billingDate = new Date(this.value);
                const dueDate = new Date(billingDate);
                dueDate.setDate(dueDate.getDate() + 30);
                dueDateInput.value = dueDate.toISOString().split('T')[0];
            });
        });

        // Close modal when clicking outside or on close button
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay || e.target.classList.contains('modal-close')) {
                modalOverlay.classList.remove('show');
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalOverlay.classList.contains('show')) {
                modalOverlay.classList.remove('show');
            }
        });
    }

    if (billForm) {
        billForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentReading = parseFloat(this.querySelector('[name="current_reading"]').value);
            const previousReading = parseFloat(this.querySelector('[name="previous_reading"]').value);

            if (currentReading < previousReading) {
                showAlert('Current reading cannot be less than previous reading.', 'error');
                return;
            }

            // Submit form via AJAX
            const formData = new FormData(this);
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    modalOverlay.classList.remove('show');
                    // Show success message
                    showAlert(data.message);
                    // Reload the page or redirect
                    window.location.href = data.redirect;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while generating the bill. Please try again.', 'error');
            });
        });

        // Dynamic consumption calculation
        const currentReadingInput = billForm.querySelector('[name="current_reading"]');
        const previousReadingInput = billForm.querySelector('[name="previous_reading"]');
        const consumptionDisplay = document.getElementById('consumption-display');
        const amountDisplay = document.getElementById('amount-display');

        function updateCalculations() {
            const current = parseFloat(currentReadingInput.value) || 0;
            const previous = parseFloat(previousReadingInput.value) || 0;
            const consumption = Math.max(0, current - previous);
            
            // Update consumption display
            consumptionDisplay.textContent = consumption.toFixed(1);
            
            // Calculate amount (₱100 for first 10 m³, ₱10 per 0.1 m³ after)
            let amount = 100; // Base amount for first 10 m³
            if (consumption > 10) {
                amount += (consumption - 10) * 10;
            }
            amountDisplay.textContent = amount.toFixed(2);
        }

        currentReadingInput.addEventListener('input', updateCalculations);
        previousReadingInput.addEventListener('input', updateCalculations);
    }

    // User dropdown menu
    const userInfo = document.querySelector('.user-info');
    const dropdown = userInfo.querySelector('.dropdown-content');
    
    if (userInfo) {
        userInfo.addEventListener('click', function(e) {
            // Only toggle dropdown if not clicking the logout link
            if (!e.target.matches('a')) {
                dropdown.classList.toggle('show');
                e.stopPropagation();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    // Table pagination
    const itemsPerPage = 10;
    const tables = document.querySelectorAll('.paginated-table');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        const pageCount = Math.ceil(rows.length / itemsPerPage);
        let currentPage = 1;

        function showPage(page) {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            rows.forEach((row, index) => {
                row.style.display = (index >= start && index < end) ? '' : 'none';
            });
        }

        // Create pagination controls
        if (pageCount > 1) {
            const pagination = document.createElement('div');
            pagination.className = 'pagination';

            // Previous button
            const prevBtn = document.createElement('a');
            prevBtn.href = '#';
            prevBtn.textContent = 'Previous';
            prevBtn.addEventListener('click', e => {
                e.preventDefault();
                if (currentPage > 1) {
                    currentPage--;
                    showPage(currentPage);
                    updatePaginationButtons();
                }
            });
            pagination.appendChild(prevBtn);

            // Page numbers
            for (let i = 1; i <= pageCount; i++) {
                const pageBtn = document.createElement('a');
                pageBtn.href = '#';
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', e => {
                    e.preventDefault();
                    currentPage = i;
                    showPage(currentPage);
                    updatePaginationButtons();
                });
                pagination.appendChild(pageBtn);
            }

            // Next button
            const nextBtn = document.createElement('a');
            nextBtn.href = '#';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', e => {
                e.preventDefault();
                if (currentPage < pageCount) {
                    currentPage++;
                    showPage(currentPage);
                    updatePaginationButtons();
                }
            });
            pagination.appendChild(nextBtn);

            function updatePaginationButtons() {
                const buttons = pagination.querySelectorAll('a');
                buttons.forEach(button => {
                    if (button.textContent === currentPage.toString()) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
                prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
                nextBtn.style.opacity = currentPage === pageCount ? '0.5' : '1';
            }

            table.parentNode.insertBefore(pagination, table.nextSibling);
            showPage(1);
            updatePaginationButtons();
        }
    });
}); 