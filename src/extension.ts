// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getWebviewContent } from './tableWebview';
import { WatchProvider } from './watchProvider';

async function fetchVariables(session: vscode.DebugSession, ref: number): Promise<any[]> {
	try {
		const response = await session.customRequest('variables', { variablesReference: ref });
		return response.variables || [];
	} catch (e) {
		console.error('Failed to fetch variables for ref', ref, e);
		return [];
	}
}

class TableViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'tableView.bottomView';
	private _view?: vscode.WebviewView;
	private _pendingData?: { data: any[], columns: string[], variableName: string };
	private _currentSession?: vscode.DebugSession;
	private _currentRef?: number;
	private _currentName?: string;
	private _currentRootEvalName?: string;

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.html = getWebviewContent();

		webviewView.webview.onDidReceiveMessage(message => this.handleMessage(message));

		if (this._pendingData) {
			this.update(
				this._pendingData.data,
				this._pendingData.columns,
				this._pendingData.variableName,
				this._currentSession,
				this._currentRef,
				this._currentRootEvalName
			);
			this._pendingData = undefined;
		}
	}

	private async handleMessage(message: any) {
		if (message.command === 'openInEditor') {
			this.openInEditor(message.data, message.columns, message.variableName);
		} else if (message.command === 'updateVariable') {
			await this.updateVariable(message.ref, message.name, message.value, message.evalName);
		} else if (message.command === 'deleteRows') {
			await this.deleteRows(message.indices);
		} else if (message.command === 'appendRow') {
			await this.appendRow();
		} else if (message.command === 'insertRow') {
			vscode.window.showInputBox({ prompt: 'Enter array index OR object property key to insert:' }).then(input => {
				if (input !== undefined && input !== '') {
					this.insertRow(input);
				}
			});
		} else if (message.command === 'refresh') {
			await this.refresh();
		}
	}

	public update(data: any[], columns: string[], variableName: string, session?: vscode.DebugSession, ref?: number, rootEvalName?: string) {
		this._currentSession = session;
		this._currentRef = ref;
		this._currentName = variableName;
		this._currentRootEvalName = rootEvalName;

		if (this._view) {
			this._view.show?.(true);
			this._view.webview.postMessage({ type: 'update', data, columns, variableName, isEditorPanel: false });
		} else {
			this._pendingData = { data, columns, variableName };
		}
	}

	private async updateVariable(ref: number, name: string, value: string, evalName?: string) {
		if (this._currentSession && ref) {
			try {
				await this._currentSession.customRequest('setVariable', { variablesReference: ref, name, value });
			} catch (e) {
				try {
					await this._currentSession.customRequest('setVariable', { variablesReference: ref, name, value: JSON.stringify(value) });
				} catch (e2) {
					if (evalName) {
						const expr = `${evalName}[${JSON.stringify(name)}] = ${value}`;
						try {
							await this.evaluateExpression(expr);
							await this.refresh();
						} catch (e3) {
							const strExpr = `${evalName}[${JSON.stringify(name)}] = ${JSON.stringify(value)}`;
							try {
								await this.evaluateExpression(strExpr);
								await this.refresh();
							} catch (e4) {
								vscode.window.showErrorMessage('Failed to update variable: ' + (e4 as Error).message);
							}
						}
					} else {
						vscode.window.showErrorMessage('Failed to update variable: ' + (e2 as Error).message);
					}
				}
			}
		}
	}



	private async evaluateExpression(expr: string) {
		if (!this._currentSession) { return; }
		const frameId = await getActiveFrameId(this._currentSession);
		const args: any = { expression: expr, context: 'repl' };
		if (frameId !== undefined) {
			args.frameId = frameId;
		}
		await this._currentSession.customRequest('evaluate', args);
	}

	private async deleteRows(indices: string[]) {
		if (!this._currentSession || !this._currentRootEvalName || indices.length === 0) { return; }
		try {
			const config = vscode.workspace.getConfiguration('tableView');
			const startIndexAt1 = config.get<boolean>('startIndexAt1', false);
			const startIndexOffset = startIndexAt1 ? 1 : 0;
			const realIndices = indices.map(idx => {
				const num = Number(idx);
				if (startIndexOffset !== 0 && !isNaN(num)) {
					return String(num - startIndexOffset);
				}
				return idx;
			});
			const indicesStr = JSON.stringify(realIndices);
			const expr = `
				(function() {
					let ids = ${indicesStr};
					if (Array.isArray(${this._currentRootEvalName})) {
						ids.map(Number).sort((a,b)=>b-a).forEach(i => ${this._currentRootEvalName}.splice(i, 1));
					} else {
						ids.forEach(i => delete ${this._currentRootEvalName}[i]);
					}
				})()
			`;
			await this.evaluateExpression(expr);
			await this.refresh();
		} catch (e) {
			vscode.window.showErrorMessage('Failed to delete rows: ' + (e as Error).message);
		}
	}

	private async appendRow() {
		if (!this._currentSession || !this._currentRootEvalName) { return; }
		try {
			const expr = `
				Array.isArray(${this._currentRootEvalName}) ? 
				${this._currentRootEvalName}.push(Array.isArray(${this._currentRootEvalName}[0]) ? [] : {}) : 
				Object.assign(${this._currentRootEvalName}, {['newProp_' + Date.now()]: {}})
			`;
			await this.evaluateExpression(expr);
			await this.refresh();
		} catch (e) {
			vscode.window.showErrorMessage('Failed to append row: ' + (e as Error).message);
		}
	}

	private async insertRow(indexOrKey: string) {
		if (!this._currentSession || !this._currentRootEvalName) { return; }
		try {
			const sanitizedInput = JSON.stringify(indexOrKey);
			const expr = `
				Array.isArray(${this._currentRootEvalName}) ? 
				${this._currentRootEvalName}.splice(parseInt(${sanitizedInput}, 10), 0, Array.isArray(${this._currentRootEvalName}[0]) ? [] : {}) : 
				(${this._currentRootEvalName}[${sanitizedInput}] = {})
			`;
			await this.evaluateExpression(expr);
			await this.refresh();
		} catch (e) {
			vscode.window.showErrorMessage('Failed to insert row: ' + (e as Error).message);
		}
	}

	public async refresh() {
		if (!this._currentSession || !this._currentRef || !this._currentName) { return; }
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Refreshing table data for ${this._currentName}...`,
			cancellable: false
		}, async () => {
			const { tableData, allColumns } = await extractTableData(this._currentSession!, this._currentRef!);
			if (this._view) {
				this._view.webview.postMessage({ type: 'update', data: tableData, columns: Array.from(allColumns), variableName: this._currentName, isEditorPanel: false });
			}
			// Update the editor panels if any (we don't track them right now, but could)
		});
	}

	private openInEditor(data: any[], columns: string[], variableName: string) {
		const panel = vscode.window.createWebviewPanel(
			'tableViewEditor',
			`Table: ${variableName}`,
			vscode.ViewColumn.Beside,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();
		panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
		panel.webview.postMessage({ type: 'update', data, columns, variableName, isEditorPanel: true });
	}
}

export async function getActiveFrameId(session: vscode.DebugSession): Promise<number | undefined> {
	try {
		const threadsResponse = await session.customRequest('threads');
		if (threadsResponse && threadsResponse.threads) {
			for (const thread of threadsResponse.threads) {
				try {
					const stackResponse = await session.customRequest('stackTrace', { threadId: thread.id, levels: 1 });
					if (stackResponse && stackResponse.stackFrames && stackResponse.stackFrames.length > 0) {
						return stackResponse.stackFrames[0].id;
					}
				} catch (e) {
					// Thread might be running
				}
			}
		}
	} catch (e) {
		// Ignore
	}
	return undefined;
}

async function evaluateAndShowTable(session: vscode.DebugSession, expression: string, provider: TableViewProvider) {
	try {
		const frameId = await getActiveFrameId(session);
		const args: any = { expression, context: 'hover' };
		if (frameId !== undefined) {
			args.frameId = frameId;
		}
		const response = await session.customRequest('evaluate', args);
		if (response && response.variablesReference > 0) {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Extracting table data for ${expression}...`,
				cancellable: false
			}, async () => {
				const { tableData, allColumns } = await extractTableData(session, response.variablesReference);
				await vscode.commands.executeCommand(`${TableViewProvider.viewType}.focus`);
				provider.update(tableData, Array.from(allColumns), expression, session, response.variablesReference, response.evaluateName || expression);
			});
		}
	} catch (e) {
		// Silently ignore evaluation errors since user might just be selecting text
	}
}

async function extractTableData(session: vscode.DebugSession, ref: number): Promise<{ tableData: any[], allColumns: Set<string> }> {
	const rows = await fetchVariables(session, ref);
	const tableData: any[] = [];
	const allColumns = new Set<string>();
	allColumns.add('(index)');

	const isSystemMetadata = (name: string) => name === 'length' || name === '__proto__' || name === '[[Prototype]]';
	const isFunction = (v: any) => v.type === 'function' || (typeof v.value === 'string' && (v.value.startsWith('function') || v.value.startsWith('f ')));

	const stripQuotes = (val: string) => {
		if (typeof val === 'string' && val.length >= 2) {
			if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
				return val.slice(1, -1);
			}
		}
		return val;
	};

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

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "table-view" is now active!');

	const provider = new TableViewProvider();
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TableViewProvider.viewType, provider)
	);

	const watchProvider = new WatchProvider();
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WatchProvider.viewType, watchProvider)
	);

	const disposableClearVariables = vscode.commands.registerCommand('tableView.clearVariables', () => {
		watchProvider.clearVariables();
	});
	context.subscriptions.push(disposableClearVariables);

	let lastClickTime = 0;
	let lastClickPosition: vscode.Position | undefined;

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(async (e) => {
			if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) return;

			const session = vscode.debug.activeDebugSession;
			if (!session) return;

			const selection = e.selections[0];
			const now = Date.now();

			// A click starts with an empty selection.
			if (selection.isEmpty) {
				lastClickTime = now;
				lastClickPosition = selection.active;
				return;
			}

			// If it's a non-empty selection right after a click, it implies a double click or rapid drag.
			if (now - lastClickTime < 500 && lastClickPosition && selection.contains(lastClickPosition)) {
				lastClickTime = 0; // Prevent re-triggering for subsequent drag events
				if (!selection.isSingleLine) return;

				const wordRangeActive = e.textEditor.document.getWordRangeAtPosition(selection.active);
				const wordRangeAnchor = e.textEditor.document.getWordRangeAtPosition(selection.anchor);

				// To be a double click, the selection should typically match the word range.
				if ((wordRangeActive && wordRangeActive.isEqual(selection)) ||
					(wordRangeAnchor && wordRangeAnchor.isEqual(selection))) {

					const text = e.textEditor.document.getText(selection).trim();
					if (text) {
						watchProvider.addVariable(text);
						vscode.commands.executeCommand(`${WatchProvider.viewType}.focus`);
					}
				}
			}
		})
	);

	const disposableHelloWorld = vscode.commands.registerCommand('table-view.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Table View!');
	});

	const disposableTableView = vscode.commands.registerCommand('table-view.viewAsTable', async (contextVariable) => {
		const session = vscode.debug.activeDebugSession;
		if (!session) {
			vscode.window.showErrorMessage('No active debug session found.');
			return;
		}

		if (typeof contextVariable === 'string') {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Extracting table data for ${contextVariable}...`,
				cancellable: false
			}, async () => {
				await evaluateAndShowTable(session, contextVariable, provider);
			});
			return;
		}

		const keys = contextVariable ? Object.keys(contextVariable).join(', ') : 'null';
		const variable = contextVariable?.variable || contextVariable;
		const ref = variable?.variablesReference ?? variable?.variableReference ?? contextVariable?.variableReference;
		const name = variable?.name ?? contextVariable?.name ?? 'unknown';
		const rootEvalName = variable?.evaluateName ?? name;

		if (typeof ref !== 'number') {
			vscode.window.showErrorMessage('Invalid variable for Table View. Available properties: ' + keys + '. Extracted variable: ' + JSON.stringify(variable));
			return;
		}

		if (ref <= 0) {
			vscode.window.showInformationMessage('Selected variable is a primitive, cannot view as table.');
			return;
		}

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Extracting table data for ${name}...`,
			cancellable: false
		}, async (progress) => {
			const { tableData, allColumns } = await extractTableData(session, ref);
			await vscode.commands.executeCommand(`${TableViewProvider.viewType}.focus`);
			provider.update(tableData, Array.from(allColumns), name, session, ref, rootEvalName);
		});
	});

	context.subscriptions.push(disposableHelloWorld, disposableTableView);
}

// This method is called when your extension is deactivated
export function deactivate() { }
