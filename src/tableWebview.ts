export function getWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Table View</title>
        <style>
            :root {
                --vscode-bg: var(--vscode-editor-background, #1e1e1e);
                --vscode-fg: var(--vscode-editor-foreground, #d4d4d4);
                --vscode-border: var(--vscode-panel-border, #444);
                --hover-bg: rgba(255, 255, 255, 0.05);
                --glass-bg: rgba(30, 30, 30, 0.6);
                --glass-border: rgba(255, 255, 255, 0.1);
            }
            body {
                background-color: transparent;
                color: var(--vscode-fg);
                font-family: var(--vscode-font-family, 'Inter', sans-serif);
                margin: 0;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                height: 100vh;
                box-sizing: border-box;
                overflow: hidden;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            .header h2 {
                margin: 0;
                font-weight: 500;
                font-size: 1.1rem;
            }
            .controls {
                position: relative;
                display: flex;
                gap: 8px;
            }
            .text-button {
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                color: var(--vscode-fg);
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
                font-size: 0.9em;
                display: none;
            }
            .text-button:hover {
                background: var(--hover-bg);
            }
            .icon-button {
                background: transparent;
                border: 1px solid transparent;
                color: var(--vscode-fg);
                padding: 4px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
                align-items: center;
                justify-content: center;
                display: none;
            }
            .icon-button:hover {
                background: var(--hover-bg);
                border-color: var(--glass-border);
            }
            .danger-btn:hover {
                background: rgba(244, 135, 113, 0.2);
                border-color: #f48771;
                color: #f48771;
            }
            .columns-dropdown {
                display: none;
                position: absolute;
                right: 0;
                top: 100%;
                margin-top: 5px;
                background: var(--vscode-bg);
                border: 1px solid var(--glass-border);
                border-radius: 4px;
                padding: 10px;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                max-height: 250px;
                overflow-y: auto;
                min-width: 150px;
            }
            .columns-dropdown.show {
                display: block;
            }
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 5px;
            }
            .dropdown-item label {
                cursor: pointer;
                user-select: none;
            }
            .table-container {
                flex: 1;
                overflow: auto;
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                background: rgba(0,0,0,0.1);
            }
            table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            th, td {
                padding: 6px 10px;
                border-bottom: 1px solid var(--vscode-border);
                border-right: 1px solid var(--vscode-border);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 300px;
                font-size: 0.9em;
            }
            th {
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                position: sticky;
                top: 0;
                z-index: 10;
                font-weight: 600;
            }
            .filter-row th {
                top: 31px;
                z-index: 9;
                background: var(--vscode-bg);
                padding: 4px;
            }
            .sortable-th {
                cursor: pointer;
                user-select: none;
            }
            .sortable-th:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            th:last-child, td:last-child {
                border-right: none;
            }
            th .resizer {
                display: inline-block;
                width: 5px;
                height: 100%;
                position: absolute;
                right: 0;
                top: 0;
                cursor: col-resize;
                z-index: 1;
            }
            th .resizer:hover {
                background: var(--vscode-fg);
                opacity: 0.5;
            }
            td[contenteditable="true"] {
                cursor: text;
                outline: none;
                transition: background 0.2s;
            }
            td[contenteditable="true"]:hover {
                background: rgba(255,255,255,0.03);
            }
            td[contenteditable="true"]:focus {
                background: rgba(255,255,255,0.08);
                box-shadow: inset 0 0 0 1px #007fd4;
            }
            .filter-input {
                width: 100%;
                box-sizing: border-box;
                background: var(--vscode-bg);
                color: var(--vscode-fg);
                border: 1px solid var(--vscode-border);
                padding: 2px 4px;
                border-radius: 2px;
                font-size: 0.85em;
            }
            .filter-input:focus {
                outline: 1px solid #007fd4;
                border-color: #007fd4;
            }
            #emptyState {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                color: var(--vscode-fg);
                opacity: 0.6;
                font-style: italic;
            }
            .chart-container {
                flex: 1;
                overflow: auto;
                padding: 10px;
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                background: rgba(0,0,0,0.1);
            }
            .chart-row {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            .chart-label {
                width: 150px;
                min-width: 150px;
                text-align: right;
                padding-right: 15px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 0.9em;
                color: var(--vscode-fg);
            }
            .chart-bar-area {
                flex: 1;
                height: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
                position: relative;
                display: flex;
                align-items: center;
            }
            .chart-bar {
                height: 100%;
                background: #007fd4;
                border-radius: 3px;
                min-width: 2px;
                transition: width 0.3s ease;
            }
            .chart-val {
                margin-left: 8px;
                font-size: 0.8em;
                color: var(--vscode-fg);
                opacity: 0.8;
                white-space: nowrap;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2 id="tableName">Select a variable to view</h2>
            <div class="controls">
                <button class="text-button" id="viewChartBtn" title="Toggle Chart View">View Chart</button>
                <button class="text-button" id="exportCsvBtn" title="Export as CSV">Export CSV</button>
                <button class="text-button" id="exportJsonBtn" title="Export as JSON">Export JSON</button>

                <button class="icon-button" id="insertRowBtn" title="Insert Row">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 12.5l3-3h-2V2H7v7.5H5l3 3z"/><path d="M2 14h12v1H2v-1z"/></svg>
                </button>
                <button class="icon-button" id="appendRowBtn" title="Append Row">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/></svg>
                </button>
                <button class="icon-button danger-btn" id="deleteRowsBtn" title="Delete Selected">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                </button>

                <button class="icon-button" id="colsBtn" title="Select Columns">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M4 14v-2h8v2H4zm0-5v-2h8v2H4zm0-5V2h8v2H4z"></path></svg>
                </button>
                <div class="columns-dropdown" id="colsDropdown"></div>

                <button class="icon-button" id="showInEditorBtn" title="Open in Editor">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M14 8h1v6H1V2h6v1H2v10h12V8zm-4-7h5v5h-1V2.71L5.71 11 5 10.29 13.29 2H10V1z"></path></svg>
                </button>
            </div>
        </div>
        
        <div id="emptyState">
            Right-click a variable in the debug view and select "View as Table".
        </div>

        <div class="table-container" id="tableContainer" style="display:none;">
            <table id="dataTable">
                <thead id="tableHead"></thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
        
        <div class="chart-container" id="chartContainer" style="display:none;"></div>
        
        <div class="header" id="paginationBar" style="display:none; margin-top: 0.5rem; justify-content: flex-end;">
            <div class="controls" style="align-items: center;">
                <button class="text-button" id="prevPageBtn" title="Previous Page">&lt; Prev</button>
                <span id="pageInfo" style="font-size: 0.9em; margin: 0 10px;">Page 1 of 1</span>
                <button class="text-button" id="nextPageBtn" title="Next Page">Next &gt;</button>
                <select id="rowsPerPageSelect" style="background: var(--vscode-bg); color: var(--vscode-fg); border: 1px solid var(--vscode-border); border-radius: 4px; padding: 2px;">
                    <option value="50">50 rows</option>
                    <option value="100" selected>100 rows</option>
                    <option value="500">500 rows</option>
                    <option value="1000">1000 rows</option>
                </select>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            let rawData = [];
            let allColumns = [];
            let visibleColumns = [];
            let filters = {};
            let sortCol = null;
            let sortAsc = true;
            let currentVariableName = '';
            
            let currentPage = 1;
            let rowsPerPage = 100;
            let totalFilteredRows = 0;
            
            let isChartView = false;

            const tableHead = document.getElementById('tableHead');
            const tableBody = document.getElementById('tableBody');
            const colsDropdown = document.getElementById('colsDropdown');
            const colsBtn = document.getElementById('colsBtn');
            const showInEditorBtn = document.getElementById('showInEditorBtn');
            const deleteRowsBtn = document.getElementById('deleteRowsBtn');
            const insertRowBtn = document.getElementById('insertRowBtn');
            const appendRowBtn = document.getElementById('appendRowBtn');
            const exportCsvBtn = document.getElementById('exportCsvBtn');
            const exportJsonBtn = document.getElementById('exportJsonBtn');
            const emptyState = document.getElementById('emptyState');
            const tableContainer = document.getElementById('tableContainer');
            const tableName = document.getElementById('tableName');

            const viewChartBtn = document.getElementById('viewChartBtn');
            const chartContainer = document.getElementById('chartContainer');

            const paginationBar = document.getElementById('paginationBar');
            const prevPageBtn = document.getElementById('prevPageBtn');
            const nextPageBtn = document.getElementById('nextPageBtn');
            const pageInfo = document.getElementById('pageInfo');
            const rowsPerPageSelect = document.getElementById('rowsPerPageSelect');

            rowsPerPageSelect.addEventListener('change', (e) => {
                rowsPerPage = parseInt(e.target.value, 10);
                currentPage = 1;
                renderBody();
            });

            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderBody();
                }
            });

            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(totalFilteredRows / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderBody();
                }
            });

            viewChartBtn.addEventListener('click', () => {
                isChartView = !isChartView;
                if (isChartView) {
                    viewChartBtn.innerText = "View Table";
                    viewChartBtn.style.color = '#fff';
                    viewChartBtn.style.background = '#007fd4';
                    tableContainer.style.display = 'none';
                    paginationBar.style.display = 'none';
                    chartContainer.style.display = 'block';
                    renderChart();
                } else {
                    viewChartBtn.innerText = "View Chart";
                    viewChartBtn.style.color = 'var(--vscode-fg)';
                    viewChartBtn.style.background = 'var(--glass-bg)';
                    tableContainer.style.display = 'block';
                    paginationBar.style.display = 'flex';
                    chartContainer.style.display = 'none';
                    renderBody();
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'update':
                        currentVariableName = message.variableName;
                        tableName.innerText = currentVariableName;
                        rawData = message.data;
                        allColumns = message.columns.filter(c => c !== '(index)');
                        visibleColumns = [...allColumns];
                        filters = {};
                        sortCol = null;
                        sortAsc = true;
                        currentPage = 1;
                        
                        emptyState.style.display = 'none';
                        if (isChartView) {
                            chartContainer.style.display = 'block';
                            paginationBar.style.display = 'none';
                            tableContainer.style.display = 'none';
                        } else {
                            tableContainer.style.display = 'block';
                            paginationBar.style.display = 'flex';
                            chartContainer.style.display = 'none';
                        }
                        
                        // Show buttons
                        colsBtn.style.display = 'flex';
                        deleteRowsBtn.style.display = 'flex';
                        insertRowBtn.style.display = 'inline-block';
                        appendRowBtn.style.display = 'inline-block';
                        exportCsvBtn.style.display = 'inline-block';
                        exportJsonBtn.style.display = 'inline-block';
                        viewChartBtn.style.display = 'inline-block';
                        if (!message.isEditorPanel) {
                            showInEditorBtn.style.display = 'flex';
                        }
                        
                        renderDropdown();
                        renderTable();
                        break;
                }
            });

            insertRowBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'insertRow' });
            });
            appendRowBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'appendRow' });
            });
            deleteRowsBtn.addEventListener('click', () => {
                const checked = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
                if (checked.length > 0) {
                    vscode.postMessage({ command: 'deleteRows', indices: checked });
                }
            });

            showInEditorBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'openInEditor',
                    data: rawData,
                    columns: ['(index)', ...allColumns],
                    variableName: currentVariableName
                });
            });

            exportCsvBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'exportData',
                    format: 'csv',
                    data: rawData,
                    columns: visibleColumns
                });
            });

            exportJsonBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'exportData',
                    format: 'json',
                    data: rawData,
                    columns: visibleColumns
                });
            });

            colsBtn.addEventListener('click', () => {
                colsDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.controls')) {
                    colsDropdown.classList.remove('show');
                }
            });

            // Handle select all checkbox
            document.addEventListener('change', (e) => {
                if (e.target.id === 'selectAll') {
                    const checked = e.target.checked;
                    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
                }
            });

            function renderDropdown() {
                colsDropdown.innerHTML = '';
                
                // Add Select All Toggle
                const selectAllDiv = document.createElement('div');
                selectAllDiv.className = 'dropdown-item';
                selectAllDiv.style.borderBottom = '1px solid var(--glass-border)';
                selectAllDiv.style.paddingBottom = '6px';
                selectAllDiv.style.marginBottom = '6px';
                
                const allSelected = visibleColumns.length === allColumns.length;
                selectAllDiv.innerHTML = \`<input type="checkbox" id="col-select-all" \${allSelected ? 'checked' : ''}> <label for="col-select-all" style="font-weight:600;">Select All</label>\`;
                
                selectAllDiv.querySelector('input').addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    if (checked) {
                        visibleColumns = [...allColumns];
                    } else {
                        visibleColumns = [];
                    }
                    renderDropdown();
                    renderTable();
                });
                
                colsDropdown.appendChild(selectAllDiv);

                allColumns.forEach(col => {
                    const div = document.createElement('div');
                    div.className = 'dropdown-item';
                    const id = 'chk-' + col.replace(/[^a-zA-Z0-9]/g, '');
                    const checked = visibleColumns.includes(col) ? 'checked' : '';
                    div.innerHTML = \`<input type="checkbox" id="\${id}" value="\${col}" \${checked}> <label for="\${id}">\${col}</label>\`;
                    
                    div.querySelector('input').addEventListener('change', (e) => {
                        if (e.target.checked) {
                            visibleColumns.push(col);
                        } else {
                            visibleColumns = visibleColumns.filter(c => c !== col);
                        }
                        visibleColumns.sort((a,b) => allColumns.indexOf(a) - allColumns.indexOf(b));
                        renderDropdown();
                        if (isChartView) renderChart();
                        else renderTable();
                    });
                    
                    colsDropdown.appendChild(div);
                });
            }

            let isResizing = false;
            let currentTh = null;
            let startX, startWidth;

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const newWidth = startWidth + (e.pageX - startX);
                currentTh.style.minWidth = newWidth + 'px';
                currentTh.style.maxWidth = newWidth + 'px';
                currentTh.style.width = newWidth + 'px';
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    currentTh = null;
                    document.body.style.cursor = 'default';
                }
            });

            function renderTable() {
                tableHead.innerHTML = '';
                const titleRow = document.createElement('tr');
                const filterRow = document.createElement('tr');
                filterRow.className = 'filter-row';

                // Checkbox Col
                const checkTh = document.createElement('th');
                checkTh.innerHTML = '<input type="checkbox" id="selectAll">';
                checkTh.style.width = '24px';
                checkTh.style.textAlign = 'center';
                titleRow.appendChild(checkTh);
                filterRow.appendChild(document.createElement('th'));

                // Index Col
                const indexTh = document.createElement('th');
                indexTh.innerText = '#';
                indexTh.style.width = '40px';
                indexTh.style.textAlign = 'right';
                indexTh.style.color = '#888';
                titleRow.appendChild(indexTh);
                filterRow.appendChild(document.createElement('th'));

                visibleColumns.forEach(col => {
                    const th = document.createElement('th');
                    th.className = 'sortable-th';
                    let text = col;
                    if (sortCol === col) {
                        text += sortAsc ? ' ▲' : ' ▼';
                    }
                    th.innerText = text;
                    th.dataset.col = col;
                    th.addEventListener('click', () => {
                        if (sortCol === col) {
                            if (!sortAsc) { sortCol = null; } 
                            else { sortAsc = false; }
                        } else {
                            sortCol = col;
                            sortAsc = true;
                        }
                        if (isChartView) renderChart();
                        else renderTable();
                    });
                    
                    const resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    resizer.addEventListener('mousedown', (e) => {
                        isResizing = true;
                        currentTh = th;
                        startX = e.pageX;
                        startWidth = th.offsetWidth;
                        e.stopPropagation();
                    });
                    th.appendChild(resizer);
                    titleRow.appendChild(th);

                    const filterTh = document.createElement('th');
                    filterTh.dataset.col = col;
                    
                    const input = document.createElement('input');
                    input.className = 'filter-input';
                    input.placeholder = 'Filter...';
                    input.value = filters[col] || '';
                    input.addEventListener('input', (e) => {
                        filters[col] = e.target.value.toLowerCase();
                        currentPage = 1;
                        if (isChartView) renderChart();
                        else renderBody();
                    });
                    filterTh.appendChild(input);
                    filterRow.appendChild(filterTh);
                });

                tableHead.appendChild(titleRow);
                tableHead.appendChild(filterRow);

                renderBody();
            }

            function renderBody() {
                tableBody.innerHTML = '';
                let filteredData = rawData.filter(row => {
                    return visibleColumns.every(col => {
                        const filterVal = filters[col];
                        if (!filterVal) return true;
                        const cellVal = String(row[col] === undefined ? '' : row[col]).toLowerCase();
                        return cellVal.includes(filterVal);
                    });
                });

                if (sortCol) {
                    filteredData.sort((a, b) => {
                        let valA = a[sortCol];
                        let valB = b[sortCol];
                        if (valA === undefined) valA = '';
                        if (valB === undefined) valB = '';
                        
                        // Numeric sort fallback
                        const numA = Number(valA);
                        const numB = Number(valB);
                        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                            return sortAsc ? numA - numB : numB - numA;
                        }

                        const strA = String(valA).toLowerCase();
                        const strB = String(valB).toLowerCase();
                        if (strA < strB) return sortAsc ? -1 : 1;
                        if (strA > strB) return sortAsc ? 1 : -1;
                        return 0;
                    });
                }
                
                totalFilteredRows = filteredData.length;
                const totalPages = Math.ceil(totalFilteredRows / rowsPerPage) || 1;
                if (currentPage > totalPages) currentPage = totalPages;
                
                pageInfo.innerText = "Page " + currentPage + " of " + totalPages + " (" + totalFilteredRows + " items)";
                
                const startIndex = (currentPage - 1) * rowsPerPage;
                const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
                
                prevPageBtn.style.display = 'inline-block';
                nextPageBtn.style.display = 'inline-block';
                prevPageBtn.disabled = currentPage === 1;
                nextPageBtn.disabled = currentPage === totalPages;
                prevPageBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
                nextPageBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';

                paginatedData.forEach(row => {
                    const tr = document.createElement('tr');
                    
                    // Checkbox
                    const checkTd = document.createElement('td');
                    checkTd.style.textAlign = 'center';
                    checkTd.innerHTML = '<input type="checkbox" class="row-checkbox" value="' + row['(index)'] + '">';
                    tr.appendChild(checkTd);

                    // Index
                    const indexTd = document.createElement('td');
                    indexTd.innerText = row['(index)'];
                    indexTd.style.textAlign = 'right';
                    indexTd.style.color = '#888';
                    indexTd.style.fontFamily = 'monospace';
                    tr.appendChild(indexTd);
                    
                    // Cells
                    visibleColumns.forEach(col => {
                        const td = document.createElement('td');
                        td.innerText = row[col] === undefined ? '' : row[col];
                        td.title = row[col];
                        td.dataset.col = col;
                        
                        td.contentEditable = "true";
                        td.addEventListener('blur', (e) => {
                            const newVal = e.target.innerText;
                            if (newVal !== String(row[col] || '')) {
                                row[col] = newVal;
                                vscode.postMessage({
                                    command: 'updateVariable',
                                    ref: row['_ref_' + col] !== undefined ? row['_ref_' + col] : row['_row_ref'],
                                    name: row['_name_' + col] !== undefined ? row['_name_' + col] : col,
                                    evalName: row['_row_eval'],
                                    value: newVal
                                });
                            }
                        });
                        td.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                            }
                        });
                        tr.appendChild(td);
                    });
                    
                    tableBody.appendChild(tr);
                });
            }

            function renderChart() {
                chartContainer.innerHTML = '';
                
                let filteredData = rawData.filter(row => {
                    return visibleColumns.every(col => {
                        const filterVal = filters[col];
                        if (!filterVal) return true;
                        const cellVal = String(row[col] === undefined ? '' : row[col]).toLowerCase();
                        return cellVal.includes(filterVal);
                    });
                });

                if (filteredData.length === 0) {
                    chartContainer.innerHTML = '<div style="opacity: 0.5;">No data matches filters.</div>';
                    return;
                }

                // Auto-detect best column for X (labels) and Y (numbers)
                let xCol = '(index)';
                let yCol = null;

                for (let col of visibleColumns) {
                    if (col === '(index)') continue;
                    // Check if mostly numbers
                    const isNum = filteredData.some(r => !isNaN(parseFloat(r[col])));
                    if (isNum && !yCol) {
                        yCol = col;
                        break;
                    }
                }
                
                if (!yCol) {
                    chartContainer.innerHTML = '<div style="opacity: 0.5;">No numeric columns found to chart.</div>';
                    return;
                }

                // If first column is strings, use it as label, else just index
                const firstCol = visibleColumns[0];
                if (firstCol !== '(index)' && firstCol !== yCol) {
                    xCol = firstCol;
                }

                if (sortCol) {
                    filteredData.sort((a, b) => {
                        let valA = a[sortCol]; let valB = b[sortCol];
                        if (valA === undefined) valA = ''; if (valB === undefined) valB = '';
                        const numA = Number(valA); const numB = Number(valB);
                        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                            return sortAsc ? numA - numB : numB - numA;
                        }
                        const strA = String(valA).toLowerCase(); const strB = String(valB).toLowerCase();
                        if (strA < strB) return sortAsc ? -1 : 1;
                        if (strA > strB) return sortAsc ? 1 : -1;
                        return 0;
                    });
                }

                const yValues = filteredData.map(r => parseFloat(r[yCol]) || 0);
                const maxY = Math.max(...yValues, 0.0001); // Prevent div by 0

                filteredData.forEach((row, i) => {
                    const label = row[xCol] !== undefined ? String(row[xCol]) : '';
                    const val = yValues[i];
                    const percent = (val / maxY) * 100;
                    
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'chart-row';
                    
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'chart-label';
                    labelDiv.title = label;
                    labelDiv.innerText = label;
                    
                    const areaDiv = document.createElement('div');
                    areaDiv.className = 'chart-bar-area';
                    
                    const barDiv = document.createElement('div');
                    barDiv.className = 'chart-bar';
                    barDiv.style.width = Math.max(percent, 0) + '%';
                    
                    const valDiv = document.createElement('div');
                    valDiv.className = 'chart-val';
                    valDiv.innerText = val.toLocaleString();
                    
                    areaDiv.appendChild(barDiv);
                    areaDiv.appendChild(valDiv);
                    rowDiv.appendChild(labelDiv);
                    rowDiv.appendChild(areaDiv);
                    chartContainer.appendChild(rowDiv);
                });
            }
        </script>
    </body>
    </html>`;
}
