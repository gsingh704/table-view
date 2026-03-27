export const watchTemplate = `
    <table id="watchTable">
        <thead>
            <tr>
                <th id="th-var" style="width: 30%;">Variable<div class="resizer" id="var-resizer"></div></th>
                <th>Value</th>
                <th style="width: 48px;"></th>
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

    `;
