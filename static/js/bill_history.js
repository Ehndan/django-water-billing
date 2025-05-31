document.addEventListener('DOMContentLoaded', function() {
    // Initialize sorting state
    let currentSort = {
        column: null,
        direction: 'asc'
    };

    // Get table elements
    const table = document.querySelector('.paginated-table');
    const headers = table.querySelectorAll('th.sortable');
    const tbody = table.querySelector('tbody');

    // Add click handlers to sortable headers
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            
            // Toggle sort direction if clicking the same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            // Update sort indicators
            headers.forEach(h => {
                h.removeAttribute('data-sort-dir');
            });
            header.setAttribute('data-sort-dir', currentSort.direction);

            // Sort the table
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const sortedRows = sortRows(rows, column, currentSort.direction);
            
            // Clear and repopulate tbody
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            sortedRows.forEach(row => tbody.appendChild(row));
        });
    });

    // Handle search input
    const searchInput = document.getElementById('table-search');
    searchInput.addEventListener('input', filterTable);

    // Handle period filter
    const periodFilter = document.getElementById('period-filter');
    periodFilter.addEventListener('change', filterTable);

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedPeriod = periodFilter.value;
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const consumerName = row.children[1].textContent.toLowerCase();
            const period = row.dataset.period;
            const matchesSearch = !searchTerm || consumerName.includes(searchTerm);
            const matchesPeriod = !selectedPeriod || period === selectedPeriod;
            
            row.style.display = matchesSearch && matchesPeriod ? '' : 'none';
        });
    }

    function sortRows(rows, column, direction) {
        return rows.sort((a, b) => {
            let aVal = getCellValue(a, column);
            let bVal = getCellValue(b, column);

            // Handle empty values - move them to the end
            if (!aVal && bVal) return 1;
            if (aVal && !bVal) return -1;
            if (!aVal && !bVal) return 0;

            // Handle numeric values
            if (!isNaN(aVal) && !isNaN(bVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }

            // Handle currency values
            if (typeof aVal === 'string' && aVal.startsWith('₱')) {
                aVal = parseFloat(aVal.replace('₱', '').replace(/,/g, ''));
                bVal = parseFloat(bVal.replace('₱', '').replace(/,/g, ''));
            }

            // Handle date values
            if (isDateString(aVal)) {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            // For non-empty values, sort according to direction
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function getCellValue(row, column) {
        const columnMap = {
            'bill_id': 0,
            'consumer_name': 1,
            'billing_period': 2,
            'consumption': 3,
            'due_date': 4,
            'amount': 5,
            'status': 6
        };
        return row.children[columnMap[column]].textContent.trim();
    }

    function isDateString(str) {
        return /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(str) || // "Mar 15, 2024"
               /^[A-Za-z]{3,}\s\d{4}$/.test(str);             // "March 2024"
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sorting state
    let currentSort = {
        column: null,
        direction: 'asc'
    };

    // Get table elements
    const table = document.querySelector('.paginated-table');
    const headers = table.querySelectorAll('th.sortable');
    const tbody = table.querySelector('tbody');
    
    // Add event handlers for edit and delete buttons
    document.querySelectorAll('[data-action="edit-bill"]').forEach(button => {
        button.addEventListener('click', function() {
            const billId = this.dataset.id;
            editBill(billId);
        });
    });

    // Replace the old delete button event listeners with a single delegated event listener
    tbody.addEventListener('click', function(e) {
        const editButton = e.target.closest('[data-action="edit-bill"]');
        const deleteButton = e.target.closest('[data-action="delete-bill"]');
        
        if (editButton) {
            const billId = editButton.dataset.id;
            editBill(billId);
        } else if (deleteButton) {
            const billId = deleteButton.dataset.id;
            const row = deleteButton.closest('tr');
            const consumerName = row.children[1].textContent;
            const billingPeriod = row.children[2].textContent;
            const amount = row.children[5].textContent;
            
            // Update delete modal content
            document.getElementById('delete-consumer-name').textContent = consumerName;
            document.getElementById('delete-billing-period').textContent = billingPeriod;
            document.getElementById('delete-amount').textContent = amount;
            
            // Set form action
            document.getElementById('delete-bill-form').action = `/bills/delete/${billId}/`;
            
            // Show modal
            document.getElementById('deleteBillModal').classList.add('show');
        }
    });
    
    // Add click handlers to sortable headers
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            
            // Toggle sort direction if clicking the same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            // Update sort indicators
            headers.forEach(h => {
                h.removeAttribute('data-sort-dir');
            });
            header.setAttribute('data-sort-dir', currentSort.direction);

            // Sort the table
            const rows = Array.from(tbody.querySelectorAll('tr:not(.empty-row)'));
            const sortedRows = sortRows(rows, column, currentSort.direction);
            
            // Clear and repopulate tbody
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            sortedRows.forEach(row => tbody.appendChild(row));
            
            // Refresh the global pagination
            const paginationInstance = table.pagination;
            if (paginationInstance) {
                paginationInstance.refresh();
            }
        });
    });

    // Handle search input
    const searchInput = document.getElementById('table-search');
    searchInput.addEventListener('input', filterTable);

    // Handle period filter
    const periodFilter = document.getElementById('period-filter');
    periodFilter.addEventListener('change', filterTable);

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedPeriod = periodFilter.value;
        const rows = tbody.querySelectorAll('tr:not(.empty-row)');
        let hasVisibleRows = false;

        rows.forEach(row => {
            const consumerName = row.children[1].textContent.toLowerCase();
            const period = row.dataset.period;
            const matchesSearch = !searchTerm || consumerName.includes(searchTerm);
            const matchesPeriod = !selectedPeriod || period === selectedPeriod;
            const isVisible = matchesSearch && matchesPeriod;
            
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) hasVisibleRows = true;
        });

        // Show no results message if needed
        let noResultsRow = tbody.querySelector('.no-results-row');
        if (!hasVisibleRows) {
            if (!noResultsRow) {
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'no-results-row';
                const td = document.createElement('td');
                td.colSpan = 8;
                td.className = 'text-center';
                td.textContent = 'No matching records found';
                noResultsRow.appendChild(td);
                tbody.appendChild(noResultsRow);
            }
        } else if (noResultsRow) {
            noResultsRow.remove();
        }

        // Refresh the global pagination
        const paginationInstance = table.pagination;
        if (paginationInstance) {
            paginationInstance.refresh();
        }
    }

    // Modal functionality
    const editModal = document.getElementById('editBillModal');
    const editCloseButtons = editModal.querySelectorAll('.modal-close');
    const editForm = document.getElementById('editBillForm');
    
    // Delete Bill Modal functionality
    const deleteModal = document.getElementById('deleteBillModal');
    const deleteCloseButtons = deleteModal.querySelectorAll('.modal-close');
    const deleteForm = document.getElementById('delete-bill-form');

    // Close edit modal handlers
    editCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            editModal.classList.remove('show');
        });
    });
    
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.classList.remove('show');
        }
    });
    
    // Close delete modal handlers
    deleteCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            deleteModal.classList.remove('show');
        });
    });

    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            deleteModal.classList.remove('show');
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = [editModal, deleteModal];
            modals.forEach(modal => {
                if (modal && modal.classList.contains('show')) {
                    modal.classList.remove('show');
                }
            });
        }
    });
    
    // Handle edit form submission
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            
            fetch(this.action, {
                method: 'POST',
                body: new FormData(this),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json().then(data => ({ status: response.ok, data })))
            .then(({ status, data }) => {
                if (status && data.status === 'success') {
                    editModal.classList.remove('show');
                    showAlert('Bill updated successfully');
                    window.location.reload();
                } else {
                    showAlert(data.message || 'An error occurred while updating the bill', 'error');
                    if (data.message === 'Permission denied') {
                        editModal.classList.remove('show');
                    } else {
                        submitButton.disabled = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while updating the bill', 'error');
                submitButton.disabled = false;
            });
        });
    }
    
    // Handle delete form submission
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            
            fetch(this.action, {
                method: 'POST',
                body: new FormData(this),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json().then(data => ({ status: response.ok, data })))
            .then(({ status, data }) => {
                if (status && data.status === 'success') {
                    deleteModal.classList.remove('show');
                    showAlert('Bill deleted successfully');
                    window.location.reload();
                } else {
                    showAlert(data.message || 'An error occurred while deleting the bill', 'error');
                    if (data.message === 'Permission denied') {
                        deleteModal.classList.remove('show');
                    } else {
                        submitButton.disabled = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while deleting the bill', 'error');
                submitButton.disabled = false;
            });
        });
    }

    // Handle reading changes and preview calculation
    const previousReadingInput = editForm.querySelector('[name="previous_reading"]');
    const currentReadingInput = editForm.querySelector('[name="current_reading"]');
    const consumptionDisplay = document.getElementById('consumption-display');
    const amountDisplay = document.getElementById('amount-display');

    function updateCalculation() {
        const previousReading = parseFloat(previousReadingInput.value) || 0;
        const currentReading = parseFloat(currentReadingInput.value) || 0;
        
        if (currentReading > previousReading) {
            const consumption = currentReading - previousReading;
            let amount = 100; // Base rate for first 10m³
            
            if (consumption > 10) {
                amount += (consumption - 10) * 10; // ₱10 per 0.1m³ excess
            }
            
            consumptionDisplay.textContent = consumption.toFixed(1);
            amountDisplay.textContent = amount.toFixed(2);
        } else {
            consumptionDisplay.textContent = '0.0';
            amountDisplay.textContent = '100.00';
        }
    }

    previousReadingInput.addEventListener('input', updateCalculation);
    currentReadingInput.addEventListener('input', updateCalculation);

function editBill(billId) {
    const modalOverlay = document.getElementById('editBillModal');
    const form = document.getElementById('editBillForm');
    
    // Reset form and enable submit button
    form.reset();
    form.querySelector('button[type="submit"]').disabled = false;
        
        // Set form action URL
        form.action = `/bills/edit/${billId}/`;
    
    // Fetch current bill data
    fetch(`/bills/edit/${billId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
    .then(data => {
            if (data.bill) {
        // Populate form with current values
        form.querySelector('[name="previous_reading"]').value = data.bill.previous_reading;
        form.querySelector('[name="current_reading"]').value = data.bill.current_reading;
        form.querySelector('[name="due_date"]').value = data.bill.due_date;
        form.querySelector('[name="status"]').value = data.bill.status;
        
        // Update calculation preview
        document.getElementById('consumption-display').textContent = data.bill.consumption;
        document.getElementById('amount-display').textContent = data.bill.amount;
        
        // Show modal
        modalOverlay.classList.add('show');
            } else {
                showAlert('Error loading bill data: Invalid response format', 'error');
            }
    })
    .catch(error => {
            console.error('Error:', error);
            showAlert('Error loading bill data. Please try again.', 'error');
    });
}

    // Function to show custom alert
    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 4px;
            z-index: 2000;
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: opacity 0.3s ease;
        `;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);
                
        // Remove the alert after 3 seconds
                    setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }
});