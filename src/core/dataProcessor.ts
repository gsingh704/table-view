import * as vscode from 'vscode';
import { fetchVariables, isSystemMetadata, isFunction, stripQuotes } from './debugAdapter';

export function parseRowIndex(rawIndex: string): number | null {
	if (/^-?\d+$/.test(rawIndex)) {
		return Number(rawIndex);
	}

	// Supports table/array indexes in any language, e.g. `foo[1]`, `bar[12]`, `obj.list[5].value`.
	const bracketMatch = rawIndex.match(/\[(-?\d+)\]/g);
	if (bracketMatch && bracketMatch.length > 0) {
		// Prefer the last encountered index in nested container expressions.
		const lastIndexLiteral = bracketMatch[bracketMatch.length - 1];
		const indexValue = Number(lastIndexLiteral.replace(/[\[\]]/g, ''));
		if (!isNaN(indexValue)) {
			return indexValue;
		}
	}

	return null;
}

export async function extractTableData(
	session: vscode.DebugSession,
	ref: number,
	onProgress?: (dataChunk: any[], newColumns: string[], isFirstChunk: boolean, totalRows: number) => void
): Promise<{ tableData: any[], allColumns: Set<string> }> {
	const rows = await fetchVariables(session, ref);
	const tableData: any[] = [];
	const allColumns = new Set<string>();
	allColumns.add('(index)');

	let processedRows = rows;

	const BATCH_SIZE = vscode.workspace.getConfiguration('tableView').get<number>('chunkSize', 100);
	let isFirstChunk = true;

	for (let i = 0; i < processedRows.length; i += BATCH_SIZE) {
		const batch = processedRows.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(batch.map(async (row) => {
			if (isSystemMetadata(row.name) || isFunction(row)) { return null; }

			let displayIndex = row.name;
			const parsedIndex = parseRowIndex(row.name);
			if (parsedIndex !== null) {
				displayIndex = parsedIndex.toString();
			} else if (!isNaN(Number(row.name))) {
				// Fallback for pure numeric row names.
				displayIndex = Number(row.name).toString();
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
				return rowData;
			} else {
				allColumns.add('value');
				return {
					'(index)': displayIndex,
					value: stripQuotes(row.value),
					'_ref_value': ref,
					'_name_value': row.name
				};
			}
		}));

		const chunkData: any[] = [];
		for (const res of batchResults) {
			if (res) {
				tableData.push(res);
				chunkData.push(res);
			}
		}

		if (onProgress && chunkData.length > 0) {
			const newColumns = Array.from(allColumns);
			onProgress(chunkData, newColumns, isFirstChunk, processedRows.length);
			isFirstChunk = false;
		}
	}
	return { tableData, allColumns };
}
