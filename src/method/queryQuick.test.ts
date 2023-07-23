import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxQueryQuick } from './queryQuick';
import { dxTableReset } from './reset';
import { ITestItem1, TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';

beforeEach(() => dxTableReset(TestTable1));

it('query returns list of items', async () => {
	jest.useRealTimers();

	const testNumber = 1;

	for (let i = 0; i < 10; i++) {
		const testString = randomString();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			gsi0Pk: `test-${testNumber}`,
			gsi0Sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.tableName,
				Item: item
			})
		);
	}

	await setTimeout(1000);
	TestItem1KeySpace.IndexHashKeyValueParamsMap;

	const result = await dxQueryQuick(TestItem1KeySpace, {
		hashKeyParams: { testNumber }
	});

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<ITestItem1>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('queries items with beginsWith on index key', async () => {
	jest.useRealTimers();

	const testNumber = 1;

	for (let i = 195; i < 205; i++) {
		const testString = String(i);

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			gsi0Pk: `test-${testNumber}`,
			gsi0Sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.tableName,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxQueryQuick(TestItem1KeySpace, {
		index: 'gsi0',
		hashKeyParams: { testNumber },
		beginsWith: 'test-1'
	});

	expect(result.items.length).toBe(5);
});

it('queries items with between on index key', async () => {
	jest.useRealTimers();

	const testNumber = 1;

	for (let i = 195; i < 205; i++) {
		const testString = String(i);

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			gsi0Pk: `test-${testNumber}`,
			gsi0Sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.tableName,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxQueryQuick(TestItem1KeySpace, {
		index: 'gsi0',
		hashKeyParams: { testNumber },
		greaterThan: 'test-198',
		lessThan: 'test-204'
	});

	expect(result.items.length).toBe(7);
});
