export const tableStyles = `
            :root {
                --vscode-bg: var(--vscode-editor-background, #1e1e1e);
                --vscode-fg: var(--vscode-editor-foreground, #d4d4d4);
                --vscode-border: var(--vscode-panel-border, #444);
                --hover-bg: rgba(255, 255, 255, 0.08);
                --glass-bg: rgba(35, 35, 35, 0.95);
                --glass-border: rgba(255, 255, 255, 0.12);
            }
            body {
                background-color: transparent;
                color: var(--vscode-fg);
                font-family: var(--vscode-font-family, 'Inter', sans-serif);
                margin: 0;
                padding: 8px;
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
                margin-bottom: 6px;
                padding: 4px 0;
                border-bottom: 1px solid var(--vscode-border);
            }
            .header h2 {
                margin: 0;
                font-weight: 500;
                font-size: 0.95rem;
            }
            .controls {
                display: flex;
                gap: 4px;
                align-items: center;
                flex-wrap: wrap;
            }
            .text-button, .icon-button {
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                color: var(--vscode-fg);
                padding: 3px 6px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
                font-size: 0.8rem;
                display: none;
                line-height: 1.2;
                min-height: 26px;
            }
            .text-button:hover, .icon-button:hover {
                background: var(--hover-bg);
            }
            .icon-button {
                min-width: 26px;
                width: 26px;
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
                background: rgba(0,0,0,0.06);
            }
            table {
                width: 100%;
                border-collapse: collapse;
                border-spacing: 0;
                text-align: left;
            }
            th, td {
                padding: 6px 8px;
                border: none;
                border-bottom: 1px solid var(--vscode-border);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 300px;
                font-size: 0.9em;
            }
            th:first-child, td:first-child {
                width: 20px;
                min-width: 20px;
                max-width: 24px;
                text-align: center;
                padding: 6px 0;
            }
            /* index column smallest possible width */
            th:nth-child(2), td:nth-child(2) {
                width: 1px;
                min-width: 1px;
                max-width: 32px;
                text-align: right;
                padding: 0 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            tr:not(:last-child) td {
                border-bottom: 1px solid var(--vscode-border);
            }
            th:last-child, td:last-child {
                border-right: none;
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
        `;
