document.addEventListener('DOMContentLoaded', function() {
    // Report modal handling
    const reportBtn = document.querySelector('[data-action="generate-report"]');
    const reportModal = document.getElementById('report-modal-overlay');
    const reportForm = document.getElementById('report-form');
    const closeReportBtns = reportModal ? reportModal.querySelectorAll('.modal-close') : [];

    if (reportBtn && reportModal) {
        // Set default month to current month
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const monthInput = reportForm.querySelector('[name="report_month"]');
        if (monthInput) {
            monthInput.value = `${year}-${month}`;
        }

        reportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            reportModal.classList.add('show');
        });

        closeReportBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                reportModal.classList.remove('show');
            });
        });

        // Close modal on cancel button in footer
        const cancelBtn = reportModal.querySelector('.btn-secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                reportModal.classList.remove('show');
            });
        }

        reportModal.addEventListener('click', function(e) {
            if (e.target === reportModal) {
                reportModal.classList.remove('show');
            }
        });
    }

    // Initialize sorting state
    let currentSort = {
        column: null,
        direction: 'asc'
    };

    // Get table elements
    const table = document.querySelector('.paginated-table');
    const headers = table.querySelectorAll('th.sortable');
    const tbody = table.querySelector('tbody');
    const MIN_ROWS = 5; // Minimum rows to display

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
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }

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
        const cells = row.querySelectorAll('td');
        const columnIndex = getColumnIndex(column);
        return cells[columnIndex]?.textContent.trim() || '';
    }

    function getColumnIndex(column) {
        const columnMap = {
            'bill_id': 0,
            'consumer_name': 1,
            'consumption': 2,
            'due_date': 3,
            'amount': 4,
            'status': 5
        };
        return columnMap[column] || 0;
    }

    function isDateString(str) {
        return /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(str) || // "Mar 15, 2024"
               /^[A-Za-z]{3,}\s\d{4}$/.test(str);             // "March 2024"
    }
});