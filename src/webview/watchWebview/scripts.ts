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

        function escapeHtml(unsafe) {
            if (unsafe === null || unsafe === undefined) return '';
            return String(unsafe)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        document.addEventListener('blur', (e) => {
            const target = e.target;
            if (target.classList.contains('watch-expr')) {
                const newExpr = target.textContent.trim();
                const index = target.closest('tr').getAttribute('data-index');
                const item = watchData[index];
                if (newExpr && newExpr !== item.expression) {
                    vscode.postMessage({ command: 'renameVariable', oldExpression: item.expression, newExpression: newExpr });
                } else if (newExpr === '') {
                    target.textContent = item.expression;
                }
            } else if (target.classList.contains('watch-val')) {
                const index = target.closest('tr').getAttribute('data-index');
                const item = watchData[index];
                vscode.postMessage({ command: 'updateVariable', expression: item.expression, value: target.textContent });
            }
        }, true);
        
        document.addEventListener('keydown', (e) => {
            const target = e.target;
            if (e.key === 'Enter' && (target.classList.contains('watch-expr') || target.classList.contains('watch-val'))) {
                e.preventDefault();
                target.blur();
            }
        });
        
        document.addEventListener('dblclick', (e) => {
            const target = e.target.closest('.watch-val-complex');
            if (target) {
                const index = target.closest('tr').getAttribute('data-index');
                const item = watchData[index];
                vscode.postMessage({ command: 'viewAsTable', expression: item.expression });
            }
        });
        
        document.addEventListener('click', (e) => {
            const btnTable = e.target.closest('.btn-table');
            if (btnTable) {
                const index = btnTable.closest('tr').getAttribute('data-index');
                const item = watchData[index];
                vscode.postMessage({ command: 'viewAsTable', expression: item.expression });
                return;
            }
            const btnRemove = e.target.closest('.btn-remove');
            if (btnRemove) {
                const index = parseInt(btnRemove.closest('tr').getAttribute('data-index'), 10);
                vscode.postMessage({ command: 'removeVariable', index });
            }
        });

        function renderTable() {
            let html = '';
            watchData.forEach((item, index) => {
                html += '<tr data-index="' + index + '">';
                
                // Expresion cell
                html += '<td><div style="display: flex; align-items: center;">';
                html += '<span class="watch-expr" contenteditable="true" style="flex: 1; margin-right: 5px; outline: none; word-break: break-all;">' + escapeHtml(item.expression) + '</span>';
                html += '</div></td>';
                
                // Value cell
                html += '<td>';
                if (item.error) {
                    html += '<span style="color: var(--vscode-errorForeground);">' + escapeHtml(item.error) + '</span>';
                } else if (!item.isComplex) {
                    html += '<span class="watch-val" contenteditable="true" style="outline: none; word-break: break-all;">' + escapeHtml(item.value) + '</span>';
                } else {
                    html += '<span class="watch-val-complex" style="cursor: pointer;" title="Double click to view as table">' + escapeHtml(item.value) + '</span>';
                }
                html += '</td>';
                
                // Actions cell
                html += '<td style="padding: 2px;">';
                html += '<div style="display: flex; justify-content: center; align-items: center; gap: 4px;">';
                if (item.isComplex) {
                    html += '<span class="btn-action btn-table" title="Show as Table"><svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM2 4h3v2H2V4zm4 0h3v2H6V4zm4 0h4v2h-4V4zM2 7h3v2H2V7zm4 0h3v2H6V7zm4 0h4v2h-4V7zM2 10h3v2H2v-2zm4 0h3v2H6v-2zm4 0h4v2h-4v-2z"/></svg></span>';
                }
                html += '<span class="btn-action danger btn-remove" title="Remove Variable"><svg fill="currentColor" width="14" height="14" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></span>';
                html += '</div></td></tr>';
            });
            watchBody.innerHTML = html;
        }
    `;
