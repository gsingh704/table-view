import * as vscode from 'vscode';

export async function fetchVariables(session: vscode.DebugSession, ref: number): Promise<any[]> {
	try {
		const response = await session.customRequest('variables', { variablesReference: ref });
		return response.variables || [];
	} catch (e) {
		console.error('Failed to fetch variables for ref', ref, e);
		return [];
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

export const isSystemMetadata = (name: string) => name === 'length' || name === '__proto__' || name === '[[Prototype]]';
export const isFunction = (v: any) => v.type === 'function' || (typeof v.value === 'string' && (v.value.startsWith('function') || v.value.startsWith('f ')));

export const stripQuotes = (val: string) => {
	if (typeof val === 'string' && val.length >= 2) {
		if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
			return val.slice(1, -1);
		}
	}
	return val;
};
