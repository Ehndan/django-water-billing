class TablePagination {
    constructor(table, rowsPerPage = 5) {
        this.table = table;
        this.rowsPerPage = rowsPerPage;
        this.currentPage = 1;
        this.tbody = table.querySelector('tbody');
        this.allRows = Array.from(this.tbody.querySelectorAll('tr:not(.empty-row):not(.no-results-row)'));
        this.totalPages = Math.ceil(this.allRows.length / this.rowsPerPage) || 1;
        
        // Create pagination container
        this.paginationContainer = document.createElement('div');
        this.paginationContainer.className = 'pagination-container';
        this.table.parentNode.insertBefore(this.paginationContainer, this.table.nextSibling);
        
        this.setupPagination();
        this.showPage(1);
    }

    showPage(pageNumber) {
        this.currentPage = pageNumber;
        const start = (pageNumber - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        
        // Remove any existing empty rows
        const existingEmptyRows = this.tbody.querySelectorAll('.empty-row');
        existingEmptyRows.forEach(row => row.remove());
        
        // Hide all rows first
        this.allRows.forEach(row => row.style.display = 'none');
        
        // Show rows for current page
        const pageRows = this.allRows.slice(start, end);
        pageRows.forEach(row => row.style.display = '');
        
        // Add empty rows if needed
        const emptyRowsNeeded = this.rowsPerPage - pageRows.length;
        if (emptyRowsNeeded > 0) {
            const colCount = this.table.querySelector('tr')?.cells.length || 
                           this.table.querySelector('thead tr')?.children.length || 1;
            
            for (let i = 0; i < emptyRowsNeeded; i++) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-row';
                for (let j = 0; j < colCount; j++) {
                    const cell = document.createElement('td');
                    cell.innerHTML = '&nbsp;';
                    emptyRow.appendChild(cell);
                }
                this.tbody.appendChild(emptyRow);
            }
        }
        
        this.updatePaginationControls();
    }

    setupPagination() {
        // Create pagination info
        const paginationInfo = document.createElement('div');
        paginationInfo.className = 'pagination-info';
        
        // Create pagination controls
        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.textContent = 'Previous';
        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) this.showPage(this.currentPage - 1);
        });
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) this.showPage(this.currentPage + 1);
        });
        
        // Add elements to container
        this.paginationContainer.appendChild(paginationInfo);
        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(nextButton);
        this.paginationContainer.appendChild(paginationControls);
        
        // Store references for updating
        this.paginationInfo = paginationInfo;
        this.prevButton = prevButton;
        this.nextButton = nextButton;
    }

    updatePaginationControls() {
        const totalRows = this.allRows.length;
        const start = totalRows === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
        const end = Math.min(start + this.rowsPerPage - 1, totalRows);
        
        // Update info text
        if (totalRows === 0) {
            this.paginationInfo.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            this.paginationInfo.textContent = `Showing ${start} to ${end} of ${totalRows} entries`;
        }
        
        // Update button states
        this.prevButton.disabled = this.currentPage === 1;
        this.nextButton.disabled = this.currentPage === this.totalPages;
    }

    refresh() {
        // Remove any empty rows
        const emptyRows = this.tbody.querySelectorAll('.empty-row');
        emptyRows.forEach(row => row.remove());
        
        // Update rows and show current page
        this.allRows = Array.from(this.tbody.querySelectorAll('tr:not(.empty-row):not(.no-results-row)'));
        this.totalPages = Math.ceil(this.allRows.length / this.rowsPerPage) || 1;
        this.showPage(1);
    }
}

// Initialize pagination for all tables when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    const tables = document.querySelectorAll('.paginated-table');
    tables.forEach(table => {
        // Store the pagination instance on the table element
        table.pagination = new TablePagination(table);
    });
});

// Global alert function
function showAlert(message, type = 'success', duration = 3000) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} toast`;
    
    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        case 'error':
        case 'danger':
            icon = 'exclamation-circle';
            break;
        case 'info':
            icon = 'info-circle';
            break;
    }
    
    // Set content with icon
    alertDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <p>${message}</p>
    `;

    // Add to document
    document.body.appendChild(alertDiv);
    
    // Remove after duration
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => alertDiv.remove(), 300);
    }, duration);
}

// Convert Django messages to toast notifications
document.addEventListener('DOMContentLoaded', function() {
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