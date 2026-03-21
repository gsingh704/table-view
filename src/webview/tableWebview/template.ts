export const tableTemplate = `
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

        `;
