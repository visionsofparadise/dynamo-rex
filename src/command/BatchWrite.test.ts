import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DxBatchWriteCommand } from './BatchWrite';
import { dxTableReset } from '../method/reset';
import { arrayOfLength, randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';

beforeEach(() => dxTableReset(TestTable1));

it('it puts 50 items', async () => {
	jest.useRealTimers();

	const items: Array<{ pk: string; sk: string; testString: string; testNumber: number }> = arrayOfLength(25).map(() => {
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
				TableName: TABLE_NAME,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const updatedItems = items.map(item => ({
		...item,
		testString: randomString()
	}));

	const result = await TestClient.send(
		new DxBatchWriteCommand({
			requests: {
				[TABLE_NAME]: updatedItems.map(i => ({ put: i }))
			}
		})
	);

	expect(result.unprocessedRequests[TABLE_NAME]).toBeUndefined();
});

it('it deletes 50 items', async () => {
	jest.useRealTimers();

	const items: Array<{ pk: string; sk: string; testString: string; testNumber: number }> = arrayOfLength(25).map(() => {
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
				TableName: TABLE_NAME,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await TestClient.send(
		new DxBatchWriteCommand({
			requests: {
				[TABLE_NAME]: items.map(({ pk, sk }) => ({ delete: { pk, sk } }))
			}
		})
	);

	expect(result.unprocessedRequests[TABLE_NAME]).toBeUndefined();
});
