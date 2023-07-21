import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxBatchWrite } from './batchWrite';
import { dxReset } from './reset';
import { arrayOfLength, randomString } from '../util/utils';
import { TestItem3KeySpace } from '../KeySpaceTest.dev';

beforeEach(() => dxReset(TestTable1));

it('it puts 50 items', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(50).map(() => {
		const testString = randomString();
		const testNumber = 1;

		return {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
			testString,
			testNumber
		};
	});

	const updatedItems = items.map(item => ({
		...item,
		testString: randomString()
	}));

	const result = await dxBatchWrite(
		TestTable1,
		updatedItems.map(item => {
			return { put: item };
		})
	);

	expect(result.unprocessedRequests.length).toBe(0);
});

it('it deletes 50 items', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(50).map(() => {
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

	const updatedItems = items.map(item => ({
		...item,
		testString: randomString()
	}));

	const result = await dxBatchWrite(
		TestTable1,
		updatedItems.map(({ pk, sk }) => {
			return { delete: { pk, sk } };
		})
	);

	expect(result.unprocessedRequests.length).toBe(0);
});

it('it puts 50 items with keyspace', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(50).map(() => {
		const testString = randomString();
		const testNumber = 1;

		return {
			testString,
			testNumber
		};
	});

	const updatedItems = items.map(item => ({
		...item,
		testString: randomString()
	}));

	const result = await dxBatchWrite(
		TestItem3KeySpace,
		updatedItems.map(item => {
			return { put: item };
		})
	);

	expect(result.unprocessedRequests.length).toBe(0);
});
