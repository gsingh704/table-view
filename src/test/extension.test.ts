import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { parseRowIndex } from '../core/dataProcessor';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('parseRowIndex handles numeric and bracket indexes in general', () => {
		assert.strictEqual(parseRowIndex('0'), 0);
		assert.strictEqual(parseRowIndex('5'), 5);
		assert.strictEqual(parseRowIndex('material[1]'), 1);
		assert.strictEqual(parseRowIndex('foo[12]'), 12);
		assert.strictEqual(parseRowIndex('bar'), null);
		assert.strictEqual(parseRowIndex('material[1].field'), 1);
		assert.strictEqual(parseRowIndex('obj.list[2][3]'), 3);
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
