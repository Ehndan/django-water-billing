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

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr:not(.empty-row)');
        let hasVisibleRows = false;

        rows.forEach(row => {
            const consumerName = row.children[1].textContent.toLowerCase();
            const matchesSearch = !searchTerm || consumerName.includes(searchTerm);
            row.style.display = matchesSearch ? '' : 'none';
            if (matchesSearch) hasVisibleRows = true;
        });

        // Show no results message if needed
        let noResultsRow = tbody.querySelector('.no-results-row');
        if (!hasVisibleRows) {
            if (!noResultsRow) {
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'no-results-row';
                const td = document.createElement('td');
                td.colSpan = 6;
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
            'consumption': 2,
            'due_date': 3,
            'amount': 4,
            'status': 5
        };
        return row.children[columnMap[column]].textContent.trim();
    }

    function isDateString(str) {
        return /^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/.test(str) || // "Mar 15, 2024"
               /^[A-Za-z]{3,}\s\d{4}$/.test(str);             // "March 2024"
    }
});