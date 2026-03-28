export const tableScripts = `
            const vscode = acquireVsCodeApi();
            
            let rawData = [];
            let allColumns = [];
            let visibleColumns = [];
            let filters = {};
            let advancedFilters = [];
            let advancedSorts = [];
            let sortIdCounter = 0;
            let currentVariableName = '';
            let currentVariableRef = -1;
            let userHiddenColumns = new Set();
            
            let currentPage = 1;
            let rowsPerPage = 100;
            let totalFilteredRows = 0;
            
            let isChartView = false;
            let selectedRowIndexes = new Set();
            let selectAllChecked = false;
            
            const filterBtn = document.getElementById('filterBtn');
            const filterDropdown = document.getElementById('filterDropdown');
            const filterRulesContainer = document.getElementById('filterRules');
            const addFilterRuleBtn = document.getElementById('addFilterRuleBtn');

            const sortBtn = document.getElementById('sortBtn');
            const sortDropdown = document.getElementById('sortDropdown');
            const sortRulesContainer = document.getElementById('sortRules');
            const addSortRuleBtn = document.getElementById('addSortRuleBtn');
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
                    viewChartBtn.innerHTML = '<svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM2 4h3v2H2V4zm4 0h3v2H6V4zm4 0h4v2h-4V4zM2 7h3v2H2V7zm4 0h3v2H6V7zm4 0h4v2h-4V7zM2 10h3v2H2v-2zm4 0h3v2H6v-2zm4 0h4v2h-4v-2z"/></svg>';
                    viewChartBtn.title = "View Table";
                    viewChartBtn.style.color = '#007fd4';
                    viewChartBtn.style.background = 'transparent';
                    tableContainer.style.display = 'none';
                    paginationBar.style.display = 'none';
                    chartContainer.style.display = 'block';
                    renderChart();
                } else {
                    viewChartBtn.innerHTML = '<svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M2.5 2h1v11h11v1h-12v-12z"/><path d="M6 9l3-3 2 2 3-4-.7-.7-2.3 3.1-2.1-2.1-3.6 3.6z"/></svg>';
                    viewChartBtn.title = "View Chart";
                    viewChartBtn.style.color = 'var(--vscode-icon-foreground, var(--vscode-fg))';
                    viewChartBtn.style.background = 'transparent';
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
                        const isSameVariable = currentVariableName === message.variableName;
                        currentVariableName = message.variableName;
                        currentVariableRef = message.variableRef;
                        tableName.innerText = currentVariableName;
                        rawData = message.data;
                        allColumns = message.columns.filter(c => c !== '(index)');
                        
                        if (!isSameVariable) {
                            visibleColumns = [...allColumns];
                            userHiddenColumns.clear();
                            advancedFilters = [];
                            filterRulesContainer.innerHTML = '';
                            advancedSorts = [];
                            sortRulesContainer.innerHTML = '';
                            currentPage = 1;
                            
                            filterBtn.classList.remove('active');
                            sortBtn.classList.remove('active');

                            for (let k in colWidths) delete colWidths[k];
                            if (typeof updateDynamicStyles === 'function') updateDynamicStyles();
                        } else {
                            // Keep user's state but ensure visible columns still exist
                            visibleColumns = visibleColumns.filter(c => allColumns.includes(c));
                            // Add any newly discovered columns unless hidden by user
                            allColumns.forEach(c => {
                                if (!visibleColumns.includes(c) && !userHiddenColumns.has(c)) {
                                    visibleColumns.push(c);
                                }
                            });
                        }

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
                        filterBtn.style.display = 'flex';
                        sortBtn.style.display = 'flex';
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
                closeAllDropdowns();
                colsDropdown.classList.toggle('show');
            });
            filterBtn.addEventListener('click', () => {
                closeAllDropdowns();
                filterDropdown.classList.toggle('show');
            });
            sortBtn.addEventListener('click', () => {
                closeAllDropdowns();
                sortDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.controls') && !e.target.closest('.list-dropdown')) {
                    closeAllDropdowns();
                }
            });
            
            function closeAllDropdowns() {
                colsDropdown.classList.remove('show');
                filterDropdown.classList.remove('show');
                sortDropdown.classList.remove('show');
            }

            let filterIdCounter = 0;
            const operators = [
                { value: 'contains', label: 'Contains' },
                { value: 'equals', label: 'Equals' },
                { value: 'not_equals', label: 'Not Equals' },
                { value: 'greater_than', label: 'Greater Than' },
                { value: 'less_than', label: 'Less Than' }
            ];

            addFilterRuleBtn.addEventListener('click', () => {
                addFilterRule();
            });

            function addFilterRule() {
                const id = filterIdCounter++;
                const rule = { id, column: visibleColumns[0] || allColumns[0] || '', operator: 'contains', value: '' };
                advancedFilters.push(rule);
                renderFilterRules();
                applyFiltersAndSort();
            }

            function renderFilterRules() {
                filterRulesContainer.innerHTML = '';
                advancedFilters.forEach(rule => {
                    const div = document.createElement('div');
                    div.className = 'filter-rule';
                    
                    const colSelect = document.createElement('select');
                    colSelect.className = 'vscode-select';
                    colSelect.style.width = '100px';
                    allColumns.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.innerText = c;
                        if (c === rule.column) opt.selected = true;
                        colSelect.appendChild(opt);
                    });
                    colSelect.addEventListener('change', (e) => {
                        rule.column = e.target.value;
                        applyFiltersAndSort();
                    });

                    const opSelect = document.createElement('select');
                    opSelect.className = 'vscode-select';
                    opSelect.style.width = '100px';
                    operators.forEach(op => {
                        const opt = document.createElement('option');
                        opt.value = op.value;
                        opt.innerText = op.label;
                        if (op.value === rule.operator) opt.selected = true;
                        opSelect.appendChild(opt);
                    });
                    opSelect.addEventListener('change', (e) => {
                        rule.operator = e.target.value;
                        applyFiltersAndSort();
                    });

                    const valInput = document.createElement('input');
                    valInput.className = 'vscode-input';
                    valInput.value = rule.value;
                    valInput.addEventListener('input', (e) => {
                        rule.value = e.target.value;
                        applyFiltersAndSort();
                    });

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-rule-btn';
                    removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';
                    removeBtn.addEventListener('click', () => {
                        advancedFilters = advancedFilters.filter(r => r.id !== rule.id);
                        renderFilterRules();
                        applyFiltersAndSort();
                    });

                    div.appendChild(colSelect);
                    div.appendChild(opSelect);
                    div.appendChild(valInput);
                    div.appendChild(removeBtn);
                    filterRulesContainer.appendChild(div);
                });
            }

            addSortRuleBtn.addEventListener('click', () => {
                addSortRule();
            });

            function addSortRule() {
                const id = sortIdCounter++;
                const rule = { id, column: visibleColumns[0] || allColumns[0] || '', order: 'asc' };
                advancedSorts.push(rule);
                renderSortRules();
                applyFiltersAndSort();
            }

            let draggedSortIndex = -1;

            function renderSortRules() {
                sortRulesContainer.innerHTML = '';
                advancedSorts.forEach((rule, index) => {
                    const div = document.createElement('div');
                    div.className = 'filter-rule';
                    div.draggable = true;
                    div.dataset.index = index;
                    
                    div.addEventListener('dragstart', (e) => {
                        draggedSortIndex = index;
                        e.dataTransfer.effectAllowed = 'move';
                        div.style.opacity = '0.5';
                    });
                    
                    div.addEventListener('dragend', () => {
                        div.style.opacity = '1';
                        draggedSortIndex = -1;
                        document.querySelectorAll('.filter-rule').forEach(el => el.style.borderTop = '');
                    });
                    
                    div.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        div.style.borderTop = '2px solid var(--vscode-focusBorder)';
                    });
                    
                    div.addEventListener('dragleave', () => {
                        div.style.borderTop = '';
                    });
                    
                    div.addEventListener('drop', (e) => {
                        e.preventDefault();
                        div.style.borderTop = '';
                        if (draggedSortIndex === -1 || draggedSortIndex === index) return;
                        
                        // Reorder the array
                        const draggedRule = advancedSorts.splice(draggedSortIndex, 1)[0];
                        advancedSorts.splice(index, 0, draggedRule);
                        
                        renderSortRules();
                        applyFiltersAndSort();
                    });

                    const dragHandle = document.createElement('span');
                    dragHandle.innerHTML = '⋮⋮';
                    dragHandle.style.cursor = 'grab';
                    dragHandle.style.color = 'var(--vscode-descriptionForeground)';
                    dragHandle.style.marginRight = '4px';
                    dragHandle.style.fontSize = '12px';

                    const colSelect = document.createElement('select');
                    colSelect.className = 'vscode-select';
                    colSelect.style.width = '120px';
                    allColumns.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.innerText = c;
                        if (c === rule.column) opt.selected = true;
                        colSelect.appendChild(opt);
                    });
                    colSelect.addEventListener('change', (e) => {
                        rule.column = e.target.value;
                        applyFiltersAndSort();
                    });

                    const orderSelect = document.createElement('select');
                    orderSelect.className = 'vscode-select';
                    orderSelect.style.width = '80px';
                    ['asc', 'desc'].forEach(ord => {
                        const opt = document.createElement('option');
                        opt.value = ord;
                        opt.innerText = ord === 'asc' ? 'Asc' : 'Desc';
                        if (ord === rule.order) opt.selected = true;
                        orderSelect.appendChild(opt);
                    });
                    orderSelect.addEventListener('change', (e) => {
                        rule.order = e.target.value;
                        applyFiltersAndSort();
                    });

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-rule-btn';
                    removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';
                    removeBtn.addEventListener('click', () => {
                        advancedSorts = advancedSorts.filter(r => r.id !== rule.id);
                        renderSortRules();
                        applyFiltersAndSort();
                    });

                    div.appendChild(dragHandle);
                    div.appendChild(colSelect);
                    div.appendChild(orderSelect);
                    div.appendChild(removeBtn);
                    sortRulesContainer.appendChild(div);
                });
            }

            function applyFiltersAndSort() {
                currentPage = 1;
                
                if (advancedFilters.length > 0) {
                    filterBtn.classList.add('active');
                } else {
                    filterBtn.classList.remove('active');
                }
                
                if (advancedSorts.length > 0) {
                    sortBtn.classList.add('active');
                } else {
                    sortBtn.classList.remove('active');
                }

                if (isChartView) renderChart();
                else renderBody();
            }

            // Handle select all checkbox
            document.addEventListener('change', (e) => {
                if (e.target.id === 'selectAll') {
                    selectAllChecked = e.target.checked;
                    const checked = selectAllChecked;
                    document.querySelectorAll('.row-checkbox').forEach(cb => {
                        cb.checked = checked;
                        if (checked) selectedRowIndexes.add(cb.value);
                        else selectedRowIndexes.delete(cb.value);
                    });
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
                        userHiddenColumns.clear();
                        colsDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb.id !== 'col-select-all') cb.checked = true;
                        });
                    } else {
                        visibleColumns = [];
                        allColumns.forEach(c => userHiddenColumns.add(c));
                        colsDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb.id !== 'col-select-all') cb.checked = false;
                        });
                    }
                    if (isChartView) renderChart();
                    else renderTable();
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
                            if (!visibleColumns.includes(col)) visibleColumns.push(col);
                            userHiddenColumns.delete(col);
                        } else {
                            visibleColumns = visibleColumns.filter(c => c !== col);
                            userHiddenColumns.add(col);
                        }
                        visibleColumns.sort((a,b) => allColumns.indexOf(a) - allColumns.indexOf(b));
                        
                        const selectAllChk = document.getElementById('col-select-all');
                        if (selectAllChk) {
                            selectAllChk.checked = visibleColumns.length === allColumns.length;
                        }

                        if (isChartView) renderChart();
                        else renderTable();
                    });
                    
                    colsDropdown.appendChild(div);
                });
            }

            const dynamicStyles = document.createElement('style');
            document.head.appendChild(dynamicStyles);
            const colWidths = {};

            function updateDynamicStyles() {
                let css = '';
                for (let key in colWidths) {
                    css += 'th[data-col-index="' + key + '"], td[data-col-index="' + key + '"] { min-width: ' + colWidths[key] + 'px !important; max-width: ' + colWidths[key] + 'px !important; width: ' + colWidths[key] + 'px !important; }\\n';
                }
                dynamicStyles.textContent = css;
            }

            let isResizing = false;
            let currentTh = null;
            let startX, startWidth;

            document.addEventListener('mousemove', (e) => {
                if (!isResizing || !currentTh) return;
                const newWidth = Math.max(20, startWidth + (e.pageX - startX));
                const colIndex = currentTh.dataset.colIndex;
                if (colIndex !== undefined) {
                    colWidths[colIndex] = newWidth;
                    updateDynamicStyles();
                } else {
                    currentTh.style.minWidth = newWidth + 'px';
                    currentTh.style.maxWidth = newWidth + 'px';
                    currentTh.style.width = newWidth + 'px';
                }
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

                // Checkbox Col
                const checkTh = document.createElement('th');
                checkTh.innerHTML = '<input type="checkbox" id="selectAll">';
                checkTh.style.width = '20px';
                checkTh.style.minWidth = '20px';
                checkTh.style.maxWidth = '24px';
                checkTh.style.textAlign = 'center';
                titleRow.appendChild(checkTh);

                // Index Col
                const indexTh = document.createElement('th');
                indexTh.innerText = '#';
                indexTh.style.width = 'auto';
                indexTh.style.minWidth = '12px';
                indexTh.style.maxWidth = '80px';
                indexTh.style.textAlign = 'right';
                indexTh.style.color = '#888';
                titleRow.appendChild(indexTh);

                visibleColumns.forEach((col, idx) => {
                    const th = document.createElement('th');
                    th.innerText = col;
                    th.dataset.col = col;
                    th.dataset.colIndex = idx;
                    
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
                });

                tableHead.appendChild(titleRow);

                renderBody();
            }

            function renderBody() {
                tableBody.innerHTML = '';
                let filteredData = rawData.filter(row => {
                    return advancedFilters.every(rule => {
                        if (!rule.value) return true;
                        const cellVal = row[rule.column];
                        let cellStr = String(cellVal === undefined ? '' : cellVal).toLowerCase();
                        let valStr = String(rule.value).toLowerCase();
                        
                        switch (rule.operator) {
                            case 'contains': return cellStr.includes(valStr);
                            case 'equals': return cellStr === valStr;
                            case 'not_equals': return cellStr !== valStr;
                            case 'greater_than': {
                                const numC_gt = Number(cellVal);
                                const numV_gt = Number(rule.value);
                                if (!isNaN(numC_gt) && !isNaN(numV_gt)) return numC_gt > numV_gt;
                                return cellStr > valStr;
                            }
                            case 'less_than': {
                                const numC_lt = Number(cellVal);
                                const numV_lt = Number(rule.value);
                                if (!isNaN(numC_lt) && !isNaN(numV_lt)) return numC_lt < numV_lt;
                                return cellStr < valStr;
                            }
                            default: return true;
                        }
                    });
                });

                if (advancedSorts.length > 0) {
                    filteredData.sort((a, b) => {
                        for (let rule of advancedSorts) {
                            let valA = a[rule.column];
                            let valB = b[rule.column];
                            if (valA === undefined) valA = '';
                            if (valB === undefined) valB = '';
                            
                            const numA = Number(valA);
                            const numB = Number(valB);
                            
                            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                                if (numA !== numB) return rule.order === 'asc' ? numA - numB : numB - numA;
                            } else {
                                const strA = String(valA).toLowerCase();
                                const strB = String(valB).toLowerCase();
                                if (strA < strB) return rule.order === 'asc' ? -1 : 1;
                                if (strA > strB) return rule.order === 'asc' ? 1 : -1;
                            }
                        }
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
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'row-checkbox';
                    checkbox.value = String(row['(index)']);
                    checkbox.checked = selectAllChecked || selectedRowIndexes.has(checkbox.value);
                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            selectedRowIndexes.add(checkbox.value);
                        } else {
                            selectedRowIndexes.delete(checkbox.value);
                            selectAllChecked = false;
                            const selectAll = document.getElementById('selectAll');
                            if (selectAll) selectAll.checked = false;
                        }
                    });
                    checkTd.appendChild(checkbox);
                    tr.appendChild(checkTd);

                    // Index
                    const indexTd = document.createElement('td');
                    indexTd.innerText = row['(index)'];
                    indexTd.style.textAlign = 'right';
                    indexTd.style.color = '#888';
                    indexTd.style.fontFamily = 'monospace';
                    tr.appendChild(indexTd);
                    
                    // Cells
                    visibleColumns.forEach((col, idx) => {
                        const td = document.createElement('td');
                        td.innerText = row[col] === undefined ? '' : row[col];
                        td.title = row[col];
                        td.dataset.col = col;
                        td.dataset.colIndex = idx;
                        
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
                    return advancedFilters.every(rule => {
                        if (!rule.value) return true;
                        const cellVal = row[rule.column];
                        let cellStr = String(cellVal === undefined ? '' : cellVal).toLowerCase();
                        let valStr = String(rule.value).toLowerCase();
                        
                        switch (rule.operator) {
                            case 'contains': return cellStr.includes(valStr);
                            case 'equals': return cellStr === valStr;
                            case 'not_equals': return cellStr !== valStr;
                            case 'greater_than': {
                                const numC_gt = Number(cellVal);
                                const numV_gt = Number(rule.value);
                                if (!isNaN(numC_gt) && !isNaN(numV_gt)) return numC_gt > numV_gt;
                                return cellStr > valStr;
                            }
                            case 'less_than': {
                                const numC_lt = Number(cellVal);
                                const numV_lt = Number(rule.value);
                                if (!isNaN(numC_lt) && !isNaN(numV_lt)) return numC_lt < numV_lt;
                                return cellStr < valStr;
                            }
                            default: return true;
                        }
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

                if (advancedSorts.length > 0) {
                    filteredData.sort((a, b) => {
                        for (let rule of advancedSorts) {
                            let valA = a[rule.column];
                            let valB = b[rule.column];
                            if (valA === undefined) valA = '';
                            if (valB === undefined) valB = '';
                            
                            const numA = Number(valA);
                            const numB = Number(valB);
                            
                            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                                if (numA !== numB) return rule.order === 'asc' ? numA - numB : numB - numA;
                            } else {
                                const strA = String(valA).toLowerCase();
                                const strB = String(valB).toLowerCase();
                                if (strA < strB) return rule.order === 'asc' ? -1 : 1;
                                if (strA > strB) return rule.order === 'asc' ? 1 : -1;
                            }
                        }
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
