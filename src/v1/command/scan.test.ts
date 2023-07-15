import { nanoid } from 'nanoid';
import { TestTable } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { randomNumber } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxScan } from './scan';
import { dxReset } from './reset';

beforeEach(() => dxReset(TestTable));

it('scan returns list of items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = nanoid();
		const testNumber = randomNumber();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable.client.send(
			new PutCommand({
				TableName: TestTable.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxScan(TestTable);

	expect(result.items.length).toBe(10);
});

it('scan on index returns list of items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = nanoid();
		const testNumber = randomNumber();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			gsi0Pk: `test-${testNumber}`,
			gsi0Sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable.client.send(
			new PutCommand({
				TableName: TestTable.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxScan(TestTable, {
		index: 'gsi0'
	});

	expect(result.items.length).toBe(10);
});

it('limits and pages correctly', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = nanoid();
		const testNumber = randomNumber();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable.client.send(
			new PutCommand({
				TableName: TestTable.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxScan(TestTable, {
		limit: 5
	});

	expect(result.items.length).toBe(5);
	expect(result.cursorKey).toBeDefined();

	const result2 = await dxScan(TestTable, {
		cursorKey: result.cursorKey
	});

	expect(result2.items.length).toBe(5);
	expect(result2.cursorKey).toBeUndefined();
});
