export const tableTemplate = `
        <div class="header">
            <h2 id="tableName">Select a variable to view</h2>
            <div class="controls">
                <button class="icon-button" id="viewChartBtn" title="View Chart">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M2.5 2h1v11h11v1h-12v-12z"/><path d="M6 9l3-3 2 2 3-4-.7-.7-2.3 3.1-2.1-2.1-3.6 3.6z"/></svg>
                </button>
                <button class="icon-button" id="exportCsvBtn" title="Export CSV">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.85 3H2v11h12V3h-.15zM3 13V4h9.8L13 4.2V13H3z"/><path d="M4 6h8v1H4V6zm0 3h6v1H4V9z"/></svg>
                </button>
                <button class="icon-button" id="exportJsonBtn" title="Export JSON">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5l-.5-.5H3v3h1V4h2V3.5zm0 9l-.5.5H3v-3h1v2h2v.5zM10 12.5l.5.5h2.5v-3h-1v2h-2v-.5zm0-9l.5-.5h2.5v3h-1V4h-2V3.5zM7 7.5L6.5 7h-2L4 7.5v1l.5.5h2l.5-.5v-1zm-1 .5H5V7h1v1zm3-1l.5-.5h2l.5.5v1l-.5.5h-2l-.5-.5v-1zm1 1V7h1v1h-1z"/></svg>
                </button>

                <button class="icon-button" id="insertRowBtn" title="Insert Row">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 12.5l3-3h-2V2H7v7.5H5l3 3z"/><path d="M2 14h12v1H2v-1z"/></svg>
                </button>
                <button class="icon-button" id="appendRowBtn" title="Append Row">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/></svg>
                </button>
                <button class="icon-button danger-btn" id="deleteRowsBtn" title="Delete Selected">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                </button>

                <button class="icon-button" id="filterBtn" title="Filter Data">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zM2.5 2v1.17l4 4.83a.5.5 0 0 1 .128.334V13.5l2-.667v-4.5a.5.5 0 0 1 .128-.334l4-4.83V2h-11z"/></svg>
                </button>
                <div class="list-dropdown" id="filterDropdown">
                    <div id="filterRules"></div>
                    <button class="text-button" id="addFilterRuleBtn" style="display:inline-block; margin-top:5px; width:100%;">+ Add Filter</button>
                </div>

                <button class="icon-button" id="sortBtn" title="Sort Data">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z"/></svg>
                </button>
                <div class="list-dropdown filter-dropdown" id="sortDropdown">
                    <div id="sortRules"></div>
                    <button class="text-button" id="addSortRuleBtn" style="display:inline-block; margin-top:5px; width:100%;">+ Add Sort</button>
                </div>

                <button class="icon-button" id="colsBtn" title="Select Columns">
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16"><path d="M4 14v-2h8v2H4zm0-5v-2h8v2H4zm0-5V2h8v2H4z"></path></svg>
                </button>
                <div class="columns-dropdown list-dropdown" id="colsDropdown"></div>

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
