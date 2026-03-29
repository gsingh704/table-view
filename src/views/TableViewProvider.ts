import * as vscode from 'vscode';
import { getTableWebviewContent } from '../webview/tableWebview';
import { getActiveFrameId } from '../core/debugAdapter';
import { extractTableData } from '../core/dataProcessor';

export class TableViewProvider {
	public static readonly viewType = 'tableView.bottomView';
	private _panel?: vscode.WebviewPanel;
	private _pendingData?: { data: any[], columns: string[], variableName: string, variableRef?: number };
	private _currentSession?: vscode.DebugSession;
	private _currentRef?: number;
	private _currentName?: string;
	private _currentRootEvalName?: string;
	private _autoRefreshTimer?: NodeJS.Timeout;
	private _disposables: vscode.Disposable[] = [];
	private _onDispose?: () => void;

	constructor(onDispose?: () => void) {
		this._onDispose = onDispose;
		this._disposables.push(vscode.debug.onDidChangeActiveDebugSession(() => this.triggerAutoRefresh()));
		this._disposables.push(vscode.debug.onDidReceiveDebugSessionCustomEvent(() => this.triggerAutoRefresh()));
		this._disposables.push(vscode.debug.onDidTerminateDebugSession(() => this.triggerAutoRefresh()));
		this._disposables.push(vscode.debug.onDidStartDebugSession(() => this.triggerAutoRefresh()));
		this._disposables.push(vscode.debug.onDidChangeBreakpoints(() => this.triggerAutoRefresh()));
	}


	private triggerAutoRefresh() {
		if (!this._panel || !this._currentSession || !this._currentRef) {
			return;
		}

		if (this._autoRefreshTimer) {
			clearTimeout(this._autoRefreshTimer);
		}

		this._autoRefreshTimer = setTimeout(() => {
			this.refresh();
		}, 150);
	}

	public show(initialName?: string) {
		if (this._panel) {
			this._panel.reveal(vscode.ViewColumn.Active);
		} else {
			this._panel = vscode.window.createWebviewPanel(
				'tableViewEditor',
				`Table: ${initialName || this._currentName || 'Data'}`,
				vscode.ViewColumn.Active,
				{ enableScripts: true, retainContextWhenHidden: true }
			);

			this._panel.webview.html = getTableWebviewContent();
			this._panel.webview.onDidReceiveMessage(message => this.handleMessage(message));
			this._panel.onDidDispose(() => {
				this._panel = undefined;
				this._disposables.forEach(d => d.dispose());
				this._disposables = [];
				if (this._onDispose) {
					this._onDispose();
				}
			});
		}

		if (this._pendingData) {
			this.update(
				this._pendingData.data,
				this._pendingData.columns,
				this._pendingData.variableName,
				this._currentSession,
				this._pendingData.variableRef || this._currentRef,
				this._currentRootEvalName
			);
			this._pendingData = undefined;
		}
	}

	private async handleMessage(message: any) {
		if (message.command === 'updateVariable') {
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
		} else if (message.command === 'exportData') {
			await this.exportData(message.format, message.data, message.columns);
		}
	}

	private async exportData(format: 'csv' | 'json', data: any[], columns: string[]) {
		let content = '';
		if (format === 'csv') {
			content = columns.join(',') + '\n';
			content += data.map(row => columns.map(c => {
				const val = row[c] === undefined ? '' : String(row[c]);
				return `"${val.replace(/"/g, '""')}"`;
			}).join(',')).join('\n');
		} else {
			content = JSON.stringify(data.map(row => {
				const obj: any = {};
				columns.forEach(c => obj[c] = row[c]);
				return obj;
			}), null, 2);
		}

		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(`${this._currentName}_export.${format}`),
			filters: { [format.toUpperCase()]: [format] }
		});
		if (uri) {
			try {
				await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
				vscode.window.showInformationMessage(`Successfully exported data to ${uri.fsPath}`);
			} catch (e) {
				vscode.window.showErrorMessage('Failed to save export file: ' + (e as Error).message);
			}
		}
	}

	public update(data: any[], columns: string[], variableName: string, session?: vscode.DebugSession, ref?: number, rootEvalName?: string) {
		this._currentSession = session;
		this._currentRef = ref;
		this._currentName = variableName;
		this._currentRootEvalName = rootEvalName;

		if (this._panel) {
			this._panel.title = `Table: ${variableName}`;
			this._panel.webview.postMessage({ type: 'update', data, columns, variableName, variableRef: ref, isEditorPanel: true });
		} else {
			this._pendingData = { data, columns, variableName, variableRef: ref };
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
			// Since we are showing direct debugger indexes (1-based for ABAP), we keep values as-is for expressions.
			const realIndices = indices.map(idx => idx);

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

	private async resolveCurrentReference(): Promise<number | undefined> {
		if (!this._currentSession) { return this._currentRef; }

		// Try to refresh from current expression path if available.
		if (this._currentRootEvalName) {
			try {
				const frameId = await getActiveFrameId(this._currentSession);
				const args: any = { expression: this._currentRootEvalName, context: 'hover' };
				if (frameId !== undefined) {
					args.frameId = frameId;
				}
				const response = await this._currentSession.customRequest('evaluate', args);
				if (response && typeof response.variablesReference === 'number' && response.variablesReference > 0) {
					this._currentRef = response.variablesReference;
					return response.variablesReference;
				}
			} catch (e) {
				// ignore evaluate errors (e.g., not set yet), fallback to existing ref
			}
		}

		return this._currentRef;
	}

	private _isRefreshing = false;

	public async refresh() {
		if (this._isRefreshing || !this._panel || !this._currentSession || !this._currentName) {
			return;
		}

		this._isRefreshing = true;
		try {
			const currentRef = await this.resolveCurrentReference();
			if (!currentRef) {
				return;
			}

			const { tableData, allColumns } = await extractTableData(this._currentSession!, currentRef);
			if (this._panel) {
				this._panel.webview.postMessage({ type: 'update', data: tableData, columns: Array.from(allColumns), variableName: this._currentName, variableRef: currentRef, isEditorPanel: true });
			}
		} catch (e) {
			console.error(`Failed to refresh table for ${this._currentName}:`, e);
		} finally {
			this._isRefreshing = false;
		}
	}
}
