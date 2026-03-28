export const watchStyles = `
        body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-editor-foreground); }
        table {
            border-collapse: collapse;
            border-spacing: 0;
            width: 100%;
            border: 1px solid var(--vscode-panel-border);
            table-layout: fixed;
        }
        th, td {
            border: none;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 5px;
            text-align: left;
            position: relative;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        tr:last-child th, tr:last-child td {
            border-bottom: none;
        }
        th { background: var(--vscode-editor-background); position: sticky; top: 0; }
        input.edit-var, input.add-var { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); width: 100%; box-sizing: border-box; }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 2px 6px; cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
		.btn-action { cursor: pointer; color: var(--vscode-icon-foreground, #888); display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 3px; }
        .btn-action:hover { background-color: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.31)); color: var(--vscode-foreground); }
        .btn-action.danger:hover { color: var(--vscode-errorForeground); }
        .btn-action svg { width: 14px; height: 14px; }
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
    `;
