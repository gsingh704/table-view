export const watchScripts = `
        const vscode = acquireVsCodeApi();
        const watchBody = document.getElementById('watchBody');
        const newVarInput = document.getElementById('newVarInput');

        let watchData = [];

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                watchData = message.data;
                renderTable();
            } else if (message.type === 'clearInput') {
                newVarInput.value = '';
            }
        });

        newVarInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && newVarInput.value.trim()) {
                const expr = newVarInput.value.trim();
                vscode.postMessage({ command: 'addVariable', expression: expr });
            }
        });

        const thVar = document.getElementById('th-var');
        const varResizer = document.getElementById('var-resizer');
        
        let isResizingVar = false;
        let startX, startWidth;

        varResizer.addEventListener('mousedown', (e) => {
            isResizingVar = true;
            startX = e.pageX;
            startWidth = thVar.offsetWidth;
            varResizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizingVar) {
                const diff = e.pageX - startX;
                thVar.style.width = startWidth + diff + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizingVar) {
                isResizingVar = false;
                varResizer.classList.remove('resizing');
                document.body.style.cursor = '';
            }
        });

        // Add a refresh button at the top right of the view if needed, but for now just auto-refresh via VS Code commands.
        // Or send a refresh message when focusing.

        function renderTable() {
            watchBody.innerHTML = '';
            watchData.forEach((item, index) => {
                const tr = document.createElement('tr');
                
                const tdVar = document.createElement('td');
                const varDiv = document.createElement('div');
                varDiv.style.display = 'flex';
                varDiv.style.alignItems = 'center';

                const varSpan = document.createElement('span');
                varSpan.contentEditable = 'true';
                varSpan.style.flex = '1';
                varSpan.style.marginRight = '5px';
                varSpan.style.outline = 'none';
                varSpan.textContent = item.expression;
                varSpan.style.wordBreak = 'break-all';
                varSpan.onblur = (e) => {
                    const newExpr = e.target.textContent.trim();
                    if (newExpr && newExpr !== item.expression) {
                        vscode.postMessage({ command: 'renameVariable', oldExpression: item.expression, newExpression: newExpr });
                    } else if (newExpr === '') {
                        e.target.textContent = item.expression;
                    }
                };
                varSpan.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                };
                varDiv.appendChild(varSpan);
                tdVar.appendChild(varDiv);
                tr.appendChild(tdVar);

                const tdVal = document.createElement('td');
                if (item.error) {
                    tdVal.textContent = item.error;
                    tdVal.style.color = 'var(--vscode-errorForeground)';
                } else if (!item.isComplex) {
                    tdVal.contentEditable = 'true';
                    tdVal.style.outline = 'none';
                    tdVal.textContent = item.value;
                    tdVal.style.wordBreak = 'break-all';
                    tdVal.onblur = (e) => {
                        vscode.postMessage({ command: 'updateVariable', expression: item.expression, value: e.target.textContent });
                    };
                    tdVal.onkeydown = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                        }
                    };
                } else {
                    tdVal.textContent = item.value; // typically Object or Array representation
                    tdVal.style.cursor = 'pointer';
                    tdVal.title = 'Double click to view as table';
                    tdVal.ondblclick = () => {
                        vscode.postMessage({ command: 'viewAsTable', expression: item.expression });
                    };
                }
                tr.appendChild(tdVal);

                const tdActions = document.createElement('td');
                tdActions.style.padding = '2px';
                
                const actionsDiv = document.createElement('div');
                actionsDiv.style.display = 'flex';
                actionsDiv.style.justifyContent = 'center';
                actionsDiv.style.alignItems = 'center';
                actionsDiv.style.gap = '4px';

                if (item.isComplex) {
                    const btnTable = document.createElement('span');
                    btnTable.title = 'Show as Table';
                    btnTable.className = 'btn-action'; // reuse style
                    btnTable.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM2 4h3v2H2V4zm4 0h3v2H6V4zm4 0h4v2h-4V4zM2 7h3v2H2V7zm4 0h3v2H6V7zm4 0h4v2h-4V7zM2 10h3v2H2v-2zm4 0h3v2H6v-2zm4 0h4v2h-4v-2z"/></svg>';
                    btnTable.onclick = () => vscode.postMessage({ command: 'viewAsTable', expression: item.expression });
                    actionsDiv.appendChild(btnTable);
                }

                const btnX = document.createElement('span');
                btnX.title = 'Remove Variable';
                btnX.className = 'btn-action danger';
                btnX.innerHTML = '<svg fill="currentColor" width="14" height="14" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
                btnX.onclick = () => vscode.postMessage({ command: 'removeVariable', index });
                actionsDiv.appendChild(btnX);
                tdActions.appendChild(actionsDiv);
                tr.appendChild(tdActions);

                watchBody.appendChild(tr);
            });
        }
    `;
