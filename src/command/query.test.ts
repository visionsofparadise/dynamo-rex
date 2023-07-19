import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxQuery } from './query';
import { dxReset } from './reset';
import { ITestItem1, TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';

beforeEach(() => dxReset(TestTable1));

it('query returns list of items', async () => {
	jest.useRealTimers();

	const testNumber = 1;

	for (let i = 0; i < 10; i++) {
		const testString = randomString();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxQuery(TestItem1KeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': 'test-1'
		}
	});

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<ITestItem1>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('auto pages to total limit', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = randomString();
		const testNumber = 1;

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxQuery(TestItem1KeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': 'test-1'
		},
		pageLimit: 3,
		totalLimit: 6,
		autoPage: true
	});

	expect(result.items.length).toBe(6);
	expect(result.cursorKey).toBeDefined();
	expect(result.count).toBe(6);
});

it('auto pages all items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = randomString();
		const testNumber = 1;

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};

		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxQuery(TestItem1KeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': 'test-1'
		},
		pageLimit: 3,
		autoPage: true
	});

	expect(result.items.length).toBe(10);
	expect(result.cursorKey).toBeUndefined();
	expect(result.count).toBe(10);
});
