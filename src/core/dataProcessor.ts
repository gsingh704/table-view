import * as vscode from 'vscode';
import { fetchVariables, isSystemMetadata, isFunction, stripQuotes } from './debugAdapter';

export async function extractTableData(session: vscode.DebugSession, ref: number): Promise<{ tableData: any[], allColumns: Set<string> }> {
	const rows = await fetchVariables(session, ref);
	const tableData: any[] = [];
	const allColumns = new Set<string>();
	allColumns.add('(index)');

	const config = vscode.workspace.getConfiguration('tableView');
	const startIndexAt1 = config.get<boolean>('startIndexAt1', false);
	const startIndexOffset = startIndexAt1 ? 1 : 0;

	for (const row of rows) {
		if (isSystemMetadata(row.name) || isFunction(row)) { continue; }

		let displayIndex = row.name;
		if (startIndexOffset !== 0 && !isNaN(Number(row.name))) {
			displayIndex = (Number(row.name) + startIndexOffset).toString();
		}

		if (row.variablesReference > 0) {
			const cells = await fetchVariables(session, row.variablesReference);
			const rowData: any = {
				'(index)': displayIndex,
				'_row_ref': row.variablesReference,
				'_row_eval': row.evaluateName
			};
			for (const cell of cells) {
				if (isSystemMetadata(cell.name) || isFunction(cell)) { continue; }
				rowData[cell.name] = stripQuotes(cell.value);
				rowData[`_ref_${cell.name}`] = row.variablesReference;
				rowData[`_name_${cell.name}`] = cell.name;
				allColumns.add(cell.name);
			}
			tableData.push(rowData);
		} else {
			tableData.push({
				'(index)': displayIndex,
				value: stripQuotes(row.value),
				'_ref_value': ref,
				'_name_value': row.name
			});
			allColumns.add('value');
		}
	}
	return { tableData, allColumns };
}
