document.addEventListener('DOMContentLoaded', function() {
    // Add Consumer Modal functionality
    const addConsumerBtn = document.querySelector('[data-action="add-consumer"]');
    const addModalOverlay = document.getElementById('consumer-modal-overlay');
    const addForm = document.getElementById('add-consumer-form');
    const addCloseButtons = addModalOverlay.querySelectorAll('.modal-close');
    
    // Edit Consumer Modal functionality
    const editButtons = document.querySelectorAll('[data-action="edit-consumer"]');
    const editModalOverlay = document.getElementById('edit-consumer-modal-overlay');
    const editForm = document.getElementById('edit-consumer-form');
    const editCloseButtons = editModalOverlay.querySelectorAll('.modal-close');
    
    // Delete Consumer Modal Functionality
    const deleteModal = document.getElementById('delete-consumer-modal-overlay');
    const deleteButtons = document.querySelectorAll('[data-action="delete-consumer"]');
    const deleteForm = document.getElementById('delete-consumer-form');
    
    // Add Consumer Modal Events
    if (addConsumerBtn && addModalOverlay) {
        addConsumerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addModalOverlay.classList.add('show');
        });

        addCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                addModalOverlay.classList.remove('show');
            });
        });

        addModalOverlay.addEventListener('click', function(e) {
            if (e.target === addModalOverlay && !e.target.querySelector('.modal-content').contains(e.target)) {
                addModalOverlay.classList.remove('show');
            }
        });
    }

    // Edit Consumer Modal Events
    if (editButtons && editModalOverlay) {
        editButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const consumerId = this.dataset.id;
                
                // Fetch consumer data
                fetch(`/consumers/${consumerId}/get_data/`)
                    .then(response => response.json())
                    .then(data => {
                        // Populate form with consumer data
                        editForm.querySelector('[name="first_name"]').value = data.first_name;
                        editForm.querySelector('[name="middle_initial"]').value = data.middle_initial;
                        editForm.querySelector('[name="last_name"]').value = data.last_name;
                        editForm.querySelector('[name="contact_number"]').value = data.contact_number;
                        editForm.querySelector('[name="address"]').value = data.address;
                        editForm.querySelector('[name="meter_number"]').value = data.meter_number;
                        editForm.querySelector('[name="account_status"]').value = data.account_status;
                        
                        // Set form action URL
                        editForm.action = `/consumers/edit/${consumerId}/`;
                        
                        // Show modal
                        editModalOverlay.classList.add('show');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('Error loading consumer data. Please try again.', 'error');
                    });
            });
        });

        editCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                editModalOverlay.classList.remove('show');
            });
        });

        editModalOverlay.addEventListener('click', function(e) {
            if (e.target === editModalOverlay && !e.target.querySelector('.modal-content').contains(e.target)) {
                editModalOverlay.classList.remove('show');
            }
        });

        // Close modals on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (addModalOverlay.classList.contains('show')) {
                    addModalOverlay.classList.remove('show');
                }
                if (editModalOverlay.classList.contains('show')) {
                    editModalOverlay.classList.remove('show');
                }
            }
        });
    }

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
                    editModalOverlay.classList.remove('show');
                    showAlert(data.message || 'An error occurred while updating the consumer', 'error');
                    window.location.reload();
                } else {
                    showAlert(data.message || 'An error occurred while updating the consumer', 'error');
                    if (data.message === 'Permission denied') {
                        editModalOverlay.classList.remove('show');
                    } else {
                        submitButton.disabled = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while updating the consumer', 'error');
                submitButton.disabled = false;
            });
        });
    }

    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const contactNumber = this.querySelector('[name="contact_number"]').value;
            
            if (!/^\d{11}$/.test(contactNumber)) {
                showAlert('Contact number must be 11 digits.', 'error');
                return;
            }
            
            if (!confirm('Are you sure you want to add this consumer?')) {
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
                    addModalOverlay.classList.remove('show');
                    showAlert(data.message);
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while adding the consumer. Please try again.', 'error');
            });
        });
    }

    // Delete Consumer Modal Events
    const deleteCloseButtons = deleteModal.querySelectorAll('.modal-close');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const consumerId = this.dataset.id;
            const consumerName = this.dataset.name;
            
            // Update modal content
            document.getElementById('delete-consumer-name').textContent = consumerName;
            deleteForm.action = `/consumers/delete/${consumerId}/`;
            
            // Show modal
            deleteModal.classList.add('show');
        });
    });

    // Add close handlers for delete modal
    deleteCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            deleteModal.classList.remove('show');
        });
    });

    // Close delete modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal && !e.target.querySelector('.modal-content').contains(e.target)) {
            deleteModal.classList.remove('show');
        }
    });

    // Handle form submission
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
                showAlert('Consumer deleted successfully');
                window.location.reload();
            } else {
                showAlert(data.message || 'An error occurred while deleting the consumer', 'error');
                if (data.message === 'Permission denied') {
                    deleteModal.classList.remove('show');
                } else {
                    submitButton.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('An error occurred while deleting the consumer', 'error');
            submitButton.disabled = false;
        });
    });

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

            // Remove any no-results row before sorting
            let existingNoResultsRow = tbody.querySelector('.no-results-row');
            if (existingNoResultsRow) {
                existingNoResultsRow.remove();
            }
            
            // Remove all empty rows before sorting
            const existingEmptyRows = tbody.querySelectorAll('tr.empty-row');
            existingEmptyRows.forEach(row => row.remove());

            // Get actual data rows (not empty rows)
            const dataRows = Array.from(tbody.querySelectorAll('tr:not(.empty-row):not(.no-results-row)'));
            
            // Sort them
            const sortedRows = sortRows(dataRows, column, currentSort.direction);
            
            // Clear tbody completely
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            
            // Append sorted data rows in order
            sortedRows.forEach(row => {
                tbody.appendChild(row);
            });
            
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

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr:not(.empty-row):not(.no-results-row)');
        let visibleCount = 0;

        // First, remove any existing no-results message
        let existingNoResultsRow = tbody.querySelector('.no-results-row');
        if (existingNoResultsRow) {
            existingNoResultsRow.remove();
        }

        // Filter and show/hide rows
        rows.forEach(row => {
            const consumerName = row.children[1].textContent.toLowerCase();
            const matchesSearch = !searchTerm || consumerName.includes(searchTerm);
            row.style.display = matchesSearch ? '' : 'none';
            if (matchesSearch) visibleCount++;
        });

        // Refresh the global pagination
        const paginationInstance = table.pagination;
        if (paginationInstance) {
            paginationInstance.refresh();
        }
    }

    function sortRows(rows, column, direction) {
        // Filter out any empty rows that somehow got through
        const dataOnlyRows = rows.filter(row => !row.classList.contains('empty-row'));
        
        return dataOnlyRows.sort((a, b) => {
            let aVal = getCellValue(a, column);
            let bVal = getCellValue(b, column);

            // Treat whitespace and &nbsp; as empty
            const aEmpty = !aVal || aVal.trim() === '' || aVal === '\u00A0';
            const bEmpty = !bVal || bVal.trim() === '' || bVal === '\u00A0';

            // Handle empty values - always move them to the end regardless of sort direction
            if (aEmpty && !bEmpty) return 1;
            if (!aEmpty && bEmpty) return -1;
            if (aEmpty && bEmpty) return 0;

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
            'consumer_id': 0,
            'full_name': 1,
            'contact': 2,
            'meter': 4,
            'status': 5
        };
        return row.children[columnMap[column]].textContent.trim();
    }

    function isDateString(str) {
        return /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(str) || // "Mar 15, 2024"
               /^[A-Za-z]{3,}\s\d{4}$/.test(str);             // "March 2024"
    }

    // Modal functionality
    const modal = document.getElementById('viewBillsModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // View Bills Modal Events
    const viewBillsButtons = document.querySelectorAll('[data-action="view-bills"]');
    const viewBillsModal = document.getElementById('viewBillsModal');
    const viewBillsCloseBtn = viewBillsModal.querySelector('.close');
    
    viewBillsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const consumerId = this.dataset.id;
            viewBills(consumerId);
            viewBillsModal.classList.add('show');
        });
    });
    
    // Close view bills modal when clicking close button
    if (viewBillsCloseBtn) {
        viewBillsCloseBtn.addEventListener('click', function() {
            viewBillsModal.classList.remove('show');
        });
    }
    
    // Close view bills modal when clicking outside
    viewBillsModal.addEventListener('click', function(e) {
        if (e.target === viewBillsModal && !e.target.querySelector('.modal-content').contains(e.target)) {
            viewBillsModal.classList.remove('show');
        }
    });

    // Update viewBills function
    function viewBills(consumerId) {
        const modal = document.getElementById('viewBillsModal');
        const container = document.getElementById('bills-table-container');
        
        // Show loading state
        container.innerHTML = '<div class="text-center">Loading bills...</div>';
        
        // Make AJAX request
        fetch(`/consumers/${consumerId}/bills/`)
            .then(response => response.json())
            .then(data => {
                // Create table HTML
                const tableHtml = `
                    <table class="table paginated-table">
                        <thead>
                            <tr>
                                <th>Bill ID</th>
                                <th>Billing Period</th>
                                <th>Consumption</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.bills.length ? data.bills.map(bill => `
                                <tr>
                                    <td>${bill.bill_id}</td>
                                    <td>${bill.billing_period}</td>
                                    <td>${bill.meter_reading.consumption} m³</td>
                                    <td>₱${bill.amount}</td>
                                    <td>
                                        <span class="status-badge status-${bill.status}">
                                            ${bill.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="5" class="text-center">No bills found for this consumer.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                `;
                
                // Set table HTML
                container.innerHTML = tableHtml;
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = '<div class="text-center text-danger">Error loading bills. Please try again.</div>';
            });
    }
});