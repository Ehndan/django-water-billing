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
            
            // Refresh pagination if it exists
            if (typeof refreshPagination === 'function') {
                refreshPagination();
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

        // Refresh pagination if it exists
        if (typeof refreshPagination === 'function') {
            refreshPagination();
        }
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

    // Add event listener for edit bill modal
    const editBillModal = document.getElementById('editBillModal');
    if (editBillModal) {
        editBillModal.addEventListener('click', function(e) {
            if (e.target === editBillModal && !e.target.querySelector('.modal-content').contains(e.target)) {
                editBillModal.classList.remove('show');
            }
        });
    }

    // Add event listener for delete bill modal
    const deleteBillModal = document.getElementById('deleteBillModal');
    if (deleteBillModal) {
        deleteBillModal.addEventListener('click', function(e) {
            if (e.target === deleteBillModal && !e.target.querySelector('.modal-content').contains(e.target)) {
                deleteBillModal.classList.remove('show');
            }
        });
    }
});