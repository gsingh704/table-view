export function getWatchWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Variables</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-editor-foreground); }
        table { border-collapse: collapse; width: 100%; border: 1px solid var(--vscode-panel-border); table-layout: fixed; }
        th, td { border: 1px solid var(--vscode-panel-border); padding: 5px; text-align: left; position: relative; }
        th { background: var(--vscode-editor-background); position: sticky; top: 0; }
        input.edit-var { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); width: 100%; box-sizing: border-box; }
        input.add-var { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); width: 100%; box-sizing: border-box; }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 2px 6px; cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
		.btn-remove { cursor: pointer; color: var(--vscode-icon-foreground, #888); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .btn-remove:hover { color: var(--vscode-errorForeground); }
        .resizer {
            width: 5px;
            height: 100%;
            position: absolute;
            right: 0;
            top: 0;
            cursor: col-resize;
            user-select: none;
            z-index: 10;
        }
        .resizer:hover, .resizer.resizing {
            background-color: var(--vscode-focusBorder);
        }
    </style>
</head>
<body>
    <table id="watchTable">
        <thead>
            <tr>
                <th id="th-var" style="width: 50%;">Variable<div class="resizer" id="var-resizer"></div></th>
                <th>Value</th>
                <th style="width: 24px;"></th>
            </tr>
        </thead>
        <tbody id="watchBody">
            <!-- Rows will be injected here -->
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3"><input type="text" class="add-var" id="newVarInput" placeholder="Add variable to watch... (Press Enter)" /></td>
            </tr>
        </tfoot>
    </table>

    <script>
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
        const resizer = document.getElementById('var-resizer');
        let isResizing = false;
        let startX, startWidth;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.pageX;
            startWidth = thVar.offsetWidth;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const diff = e.pageX - startX;
            thVar.style.width = startWidth + diff + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
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
                tdVar.style.display = 'flex';
                tdVar.style.alignItems = 'center';

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
                tdVar.appendChild(varSpan);
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
                const btnX = document.createElement('span');
                btnX.title = 'Remove Variable';
                btnX.className = 'btn-remove';
                btnX.innerHTML = '<svg fill="currentColor" width="14" height="14" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
                btnX.onclick = () => vscode.postMessage({ command: 'removeVariable', index });
                tdActions.appendChild(btnX);
                tr.appendChild(tdActions);

                watchBody.appendChild(tr);
            });
        }
    </script>
</body>
</html>`;
}
