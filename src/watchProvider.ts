import * as vscode from 'vscode';
import { getWatchWebviewContent } from './watchWebview';
import { getActiveFrameId } from './extension';

interface WatchItem {
	expression: string;
	value?: string;
	type?: string;
	isComplex?: boolean;
	error?: string;
}

export class WatchProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'tableView.variablesView';
	private _view?: vscode.WebviewView;
	private expressions: string[] = [];

	constructor() {
		vscode.debug.onDidChangeActiveDebugSession(() => {
			this.refresh();
		});
		vscode.debug.onDidReceiveDebugSessionCustomEvent(() => {
			this.refresh();
		});
	}

	resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.html = getWatchWebviewContent();

		webviewView.webview.onDidReceiveMessage(message => {
			if (message.command === 'addVariable') {
				this.addVariable(message.expression);
				this._view?.webview.postMessage({ type: 'clearInput' });
			} else if (message.command === 'removeVariable') {
				this.expressions.splice(message.index, 1);
				this.refresh();
			} else if (message.command === 'renameVariable') {
				const idx = this.expressions.indexOf(message.oldExpression);
				if (idx !== -1) {
					if (!this.expressions.includes(message.newExpression)) {
						this.expressions[idx] = message.newExpression;
					} else {
						this.expressions.splice(idx, 1);
					}
					this.refresh();
				}
			} else if (message.command === 'updateVariable') {
				this.updateVariable(message.expression, message.value);
			} else if (message.command === 'viewAsTable') {
				vscode.commands.executeCommand('table-view.viewAsTable', message.expression);
			}
		});

		this.refresh();
	}

	public addVariable(expression: string) {
		if (!this.expressions.includes(expression)) {
			this.expressions.push(expression);
			this.refresh();
		}
	}

	public clearVariables() {
		this.expressions = [];
		this.refresh();
	}

	public async refresh() {
		if (!this._view) { return; }
		
		const session = vscode.debug.activeDebugSession;
		if (!session) {
			const data = this.expressions.map(expr => ({ expression: expr, error: 'No active debug session' }));
			this._view.webview.postMessage({ type: 'update', data });
			return;
		}

		const frameId = await getActiveFrameId(session);
		const data: WatchItem[] = [];

		for (const expr of this.expressions) {
			const args: any = { expression: expr, context: 'watch' };
			if (frameId !== undefined) {
				args.frameId = frameId;
			}
			try {
				const response = await session.customRequest('evaluate', args);
				let rawValue = response.result || response.value || 'undefined';
				if (typeof rawValue === 'string' && rawValue.length >= 2) {
					if ((rawValue.startsWith("'") && rawValue.endsWith("'")) || (rawValue.startsWith('"') && rawValue.endsWith('"'))) {
						rawValue = rawValue.slice(1, -1);
					}
				}
				data.push({
					expression: expr,
					value: rawValue,
					type: response.type,
					isComplex: response.variablesReference > 0
				});
			} catch (e) {
				data.push({
					expression: expr,
					error: (e as Error).message
				});
			}
		}

		this._view.webview.postMessage({ type: 'update', data });
	}

	private async updateVariable(expression: string, value: string) {
		const session = vscode.debug.activeDebugSession;
		if (!session) { return; }
		try {
			const frameId = await getActiveFrameId(session);
			try {
				const args: any = { expression: `${expression} = ${value}`, context: 'repl' };
				if (frameId !== undefined) {
					args.frameId = frameId;
				}
				await session.customRequest('evaluate', args);
			} catch (e) {
				// Retry as a string if the user entered unquoted text like "John"
				const argsStr: any = { expression: `${expression} = ${JSON.stringify(value)}`, context: 'repl' };
				if (frameId !== undefined) {
					argsStr.frameId = frameId;
				}
				await session.customRequest('evaluate', argsStr);
			}
			await this.refresh();
		} catch (e) {
			vscode.window.showErrorMessage(`Failed to update ${expression}: ${(e as Error).message}`);
		}
	}
}
