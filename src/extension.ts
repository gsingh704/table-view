// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WatchProvider } from './views/WatchProvider';
import { TableViewProvider } from './views/TableViewProvider';
import { getActiveFrameId } from './core/debugAdapter';
import { extractTableData } from './core/dataProcessor';



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
				let firstBatchSent = false;
				const { tableData, allColumns } = await extractTableData(session, response.variablesReference, (chunk, columns, isFirst) => {
					if (isFirst) {
						provider.update(chunk, columns, expression, session, response.variablesReference, response.evaluateName || expression);
						firstBatchSent = true;
					} else {
						provider.appendData(chunk, columns);
					}
				});
				if (!firstBatchSent) {
					provider.update(tableData, Array.from(allColumns), expression, session, response.variablesReference, response.evaluateName || expression);
				}
			});
		} else {
			vscode.window.showErrorMessage(`Cannot view primitive value as table: ${expression}`);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Failed to evaluate expression: ${expression}`);
	}
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "table-view" is now active!');

	const watchProvider = new WatchProvider();
	const openProviders = new Map<string, TableViewProvider>();

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WatchProvider.viewType, watchProvider, {
			webviewOptions: { retainContextWhenHidden: true }
		})
	);

	const disposableClearVariables = vscode.commands.registerCommand('tableView.clearVariables', () => {
		watchProvider.clearVariables();
	});

	const disposableOpenSettings = vscode.commands.registerCommand('tableView.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'tableView');
	});

	context.subscriptions.push(disposableClearVariables, disposableOpenSettings);

	let lastClickTime = 0;
	let lastClickPosition: vscode.Position | undefined;

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(async (e) => {
			if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) { return; }

			const session = vscode.debug.activeDebugSession;
			if (!session) { return; }

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
				if (!selection.isSingleLine) { return; }

				const wordRangeActive = e.textEditor.document.getWordRangeAtPosition(selection.active);
				const wordRangeAnchor = e.textEditor.document.getWordRangeAtPosition(selection.anchor);

				// To be a double click, the selection should typically match the word range.
				if ((wordRangeActive && wordRangeActive.isEqual(selection)) ||
					(wordRangeAnchor && wordRangeAnchor.isEqual(selection))) {

					const text = e.textEditor.document.getText(selection).trim();
					if (text) {
						try {
							const frameId = await getActiveFrameId(session);
							const args: any = { expression: text, context: 'hover' };
							if (frameId !== undefined) {
								args.frameId = frameId;
							}
							const response = await session.customRequest('evaluate', args);
							
							if (response && response.result) {
								const resStr = String(response.result);
								const resStrLower = resStr.toLowerCase();
								// Languages like Java, C++, and C# typically reject the evaluate promise natively (caught below).
								// For JS/Python which might resolve with an error message, we do a basic string check:
								if (resStrLower.includes('referenceerror') || 
									resStrLower.includes('syntaxerror') ||
									resStrLower.includes('nameerror') ||
									resStrLower.includes('not defined') ||
									resStrLower.includes('does not exist') ||
									resStrLower.includes('cannot be resolved')) {
									return; // Ignore invalid variables or keywords
								}
							}
							
							watchProvider.addVariable(text);
							vscode.commands.executeCommand(`${WatchProvider.viewType}.focus`);
						} catch (err) {
							// Ignore if it fails to evaluate entirely
						}
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
			let provider = openProviders.get(contextVariable);
			let isNew = false;
			if (!provider) {
				provider = new TableViewProvider(() => openProviders.delete(contextVariable));
				openProviders.set(contextVariable, provider);
				isNew = true;
			}

			provider.show(contextVariable);
			if (isNew) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Extracting table data for ${contextVariable}...`,
					cancellable: false
				}, async () => {
					await evaluateAndShowTable(session, contextVariable, provider!);
				});
			}
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

		let provider = openProviders.get(name);
		let isNew = false;
		if (!provider) {
			provider = new TableViewProvider(() => openProviders.delete(name));
			openProviders.set(name, provider);
			isNew = true;
		}

		provider.show(name);

		if (isNew) {
			provider.update([], [], name, session, ref, rootEvalName);
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Extracting table data for ${name}...`,
				cancellable: false
			}, async (progress) => {
				let firstBatchSent = false;
				const { tableData, allColumns } = await extractTableData(session, ref, (chunk, columns, isFirst) => {
					if (isFirst) {
						provider!.update(chunk, columns, name, session, ref, rootEvalName);
						firstBatchSent = true;
					} else {
						provider!.appendData(chunk, columns);
					}
				});
				
				if (!firstBatchSent) {
					provider!.update(tableData, Array.from(allColumns), name, session, ref, rootEvalName);
				}
			});
		}
	});

	context.subscriptions.push(disposableHelloWorld, disposableTableView);
}

// This method is called when your extension is deactivated
export function deactivate() { }
