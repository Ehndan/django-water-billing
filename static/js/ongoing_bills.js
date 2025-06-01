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
    
    // Print Bills Modal functionality
    const printBillsBtn = document.querySelector('[data-action="print-bills"]');
    const printBillsModal = document.getElementById('print-bills-modal-overlay');
    const printBillsForm = document.getElementById('print-bills-form');
    const printBillsCloseButtons = printBillsModal.querySelectorAll('.modal-close');
    
    // Show print bills modal when clicking print button
    if (printBillsBtn && printBillsModal) {
        printBillsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            printBillsModal.classList.add('show');
            
            // Set default billing period to current month
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const billingPeriodInput = printBillsForm.querySelector('[name="billing_period"]');
            if (billingPeriodInput) {
                billingPeriodInput.value = `${year}-${month}`;
            }
        });
        
        // Close print bills modal when clicking close button
        printBillsCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                printBillsModal.classList.remove('show');
            });
        });
        
        // Close print bills modal when clicking outside
        printBillsModal.addEventListener('click', function(e) {
            if (e.target === printBillsModal && !e.target.querySelector('.modal-content').contains(e.target)) {
                printBillsModal.classList.remove('show');
            }
        });
    }

    // Mark as Paid functionality
    const markPaidModal = document.getElementById('mark-paid-modal-overlay');
    const markPaidForm = document.getElementById('mark-paid-form');
    const markPaidCloseButtons = markPaidModal.querySelectorAll('.modal-close');
    
    // Add event listener for mark as paid buttons
    tbody.addEventListener('click', function(e) {
        const markPaidBtn = e.target.closest('[data-action="mark-paid"]');
        if (markPaidBtn) {
            const billId = markPaidBtn.dataset.id;
            const consumer = markPaidBtn.dataset.consumer;
            const amount = markPaidBtn.dataset.amount;
            
            // Update modal content
            document.getElementById('preview-bill-id').textContent = billId;
            document.getElementById('preview-consumer').textContent = consumer;
            document.getElementById('preview-amount').textContent = amount;
            
            // Set form action
            markPaidForm.action = `/bills/mark-paid/${billId}/`;
            
            // Show modal
            markPaidModal.classList.add('show');
        }
    });
    
    // Close mark paid modal when clicking close button
    markPaidCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            markPaidModal.classList.remove('show');
        });
    });
    
    // Close mark paid modal when clicking outside
    markPaidModal.addEventListener('click', function(e) {
        if (e.target === markPaidModal && !e.target.querySelector('.modal-content').contains(e.target)) {
            markPaidModal.classList.remove('show');
        }
    });
    
    // Handle mark as paid form submission
    if (markPaidForm) {
        markPaidForm.addEventListener('submit', function(e) {
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
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Close modal
                    markPaidModal.classList.remove('show');
                    // Reload page to update table
                    window.location.reload();
                } else {
                    submitButton.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                submitButton.disabled = false;
            });
        });
    }

    // Generate Bill Modal functionality
    const generateBillBtn = document.querySelector('[data-action="generate-bill"]');
    const generateBillModal = document.getElementById('bill-modal-overlay');
    const generateBillForm = document.getElementById('generate-bill-form');
    const generateBillCloseButtons = generateBillModal.querySelectorAll('.modal-close');
    const consumerSelect = generateBillForm.querySelector('[name="consumer"]');
    const billingPeriodInput = generateBillForm.querySelector('[name="billing_period"]');
    const previousReadingInput = generateBillForm.querySelector('[name="previous_reading"]');
    const currentReadingInput = generateBillForm.querySelector('[name="current_reading"]');
    const dueDateInput = generateBillForm.querySelector('[name="due_date"]');
    const consumptionDisplay = document.getElementById('consumption-display');
    const amountDisplay = document.getElementById('amount-display');

    // Show modal when clicking generate button
    if (generateBillBtn && generateBillModal) {
        generateBillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateBillModal.classList.add('show');
            
            // Set default billing period to current month
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            billingPeriodInput.value = `${year}-${month}`;
            
            // Reset form
            generateBillForm.reset();
            previousReadingInput.value = "0.0";
            updateCalculation();
        });
        
        // Close modal when clicking close button
        generateBillCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                generateBillModal.classList.remove('show');
            });
        });
        
        // Close modal when clicking outside
        generateBillModal.addEventListener('click', function(e) {
            if (e.target === generateBillModal && !e.target.querySelector('.modal-content').contains(e.target)) {
                generateBillModal.classList.remove('show');
            }
        });
    }

    // Close all modals on escape key
        document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = [printBillsModal, markPaidModal, generateBillModal];
            modals.forEach(modal => {
                if (modal && modal.classList.contains('show')) {
                    modal.classList.remove('show');
            }
        });
    }
    });

    // Handle consumer selection
    consumerSelect.addEventListener('change', function() {
        const consumerId = this.value;
        if (consumerId) {
            // Fetch last reading and latest bill period for this consumer
            fetch(`/bills/last-reading/${consumerId}/`)
                .then(response => response.json())
                .then(data => {
                    previousReadingInput.value = data.last_reading.toFixed(1);
                    
                    // If there's a latest bill, set minimum billing period
                    if (data.latest_bill_period) {
                        const latestDate = new Date(data.latest_bill_period);
                        const minYear = latestDate.getFullYear();
                        const minMonth = String(latestDate.getMonth() + 1).padStart(2, '0');
                        billingPeriodInput.min = `${minYear}-${minMonth}`;
                        
                        // If current value is before min, update it
                        if (billingPeriodInput.value < billingPeriodInput.min) {
                            billingPeriodInput.value = billingPeriodInput.min;
                        }
                    }
                    
                    updateCalculation();
                })
                .catch(error => {
                    console.error('Error:', error);
                    previousReadingInput.value = "0.0";
                    updateCalculation();
                });
        } else {
            previousReadingInput.value = "0.0";
            updateCalculation();
        }
    });

    // Handle billing period change
    billingPeriodInput.addEventListener('change', function() {
        // Set minimum due date to first day of next month after billing period
        const selectedPeriod = new Date(this.value + "-01");
        const nextMonth = new Date(selectedPeriod.getFullYear(), selectedPeriod.getMonth() + 1, 1);
        const minDueDate = nextMonth.toISOString().split('T')[0];
        dueDateInput.min = minDueDate;
        
        // If current due date is before min date, update it
        if (dueDateInput.value && dueDateInput.value < minDueDate) {
            dueDateInput.value = minDueDate;
        }
    });

    // Update calculations function
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
            currentReadingInput.setCustomValidity('');
        } else {
            consumptionDisplay.textContent = '0.0';
            amountDisplay.textContent = '100.00';
            if (currentReading && currentReading <= previousReading) {
                currentReadingInput.setCustomValidity('Current reading must be greater than previous reading');
            }
        }
    }

    // Validate current reading and update calculations
    currentReadingInput.addEventListener('input', updateCalculation);

    // Form submission validation
    generateBillForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const previousReading = parseFloat(previousReadingInput.value) || 0;
        const currentReading = parseFloat(currentReadingInput.value) || 0;
        const selectedPeriod = new Date(billingPeriodInput.value + "-01");
        const dueDate = new Date(dueDateInput.value);
        
        let errors = [];
        
        if (!consumerSelect.value) {
            errors.push("Please select a consumer");
        }
        
        if (currentReading <= previousReading) {
            errors.push("Current reading must be greater than previous reading");
        }
        
        if (dueDate <= selectedPeriod) {
            errors.push("Due date must be after the billing period");
        }
        
        if (errors.length > 0) {
            return;
        }

        // If validation passes, submit via AJAX
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
                // Close modal
                generateBillModal.classList.remove('show');
                // Reload page after successful submission
                window.location.reload();
            } else {
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            submitButton.disabled = false;
        });
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
});