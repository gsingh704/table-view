export const tableScripts = `
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
        `;
