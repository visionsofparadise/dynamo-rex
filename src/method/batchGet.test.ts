import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxTableBatchGet } from './batchGet';
import { dxReset } from './reset';
import { arrayOfLength, randomString } from '../util/utils';

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
				TableName: TestTable1.tableName,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await dxTableBatchGet(
		TestTable1,
		items.map(({ pk, sk }) => {
			return { pk, sk };
		})
	);

	expect(result.items.length).toBe(120);
});
