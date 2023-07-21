import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxBatchGet } from './batchGet';
import { dxReset } from './reset';
import { arrayOfLength, randomString } from '../util/utils';
import { TestItem3KeySpace } from '../KeySpaceTest.dev';

beforeEach(() => dxReset(TestTable1));

it('it gets 120 items', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(120).map(() => {
		const testString = randomString();
		const testNumber = 1;

		return {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};
	});

	for (const item of items) {
		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxBatchGet(
		TestTable1,
		items.map(({ pk, sk }) => ({ pk, sk }))
	);

	expect(result.items.length).toBe(120);
});

it('it gets 120 items from keyspace', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(120).map(() => {
		const testString = randomString();
		const testNumber = 1;

		return {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};
	});

	for (const item of items) {
		await TestTable1.client.send(
			new PutCommand({
				TableName: TestTable1.config.name,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxBatchGet(
		TestItem3KeySpace,
		items.map(({ testString, testNumber }) => ({ testString, testNumber }))
	);

	expect(result.items.length).toBe(120);

	expect(Object.keys(result.items[0]).length).toBe(2);
});
