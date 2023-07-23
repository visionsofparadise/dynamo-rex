import { dxTableScan } from './scan';
import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { dxTableReset } from './reset';
import { randomNumber, randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

beforeEach(() => dxTableReset(TestTable1));

it('reset deletes all items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = randomString();
		const testNumber = randomNumber();

		const item = {
			pk: `test-${testNumber}`,
			sk: `test-${testString}`,
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

	const beforeReset = await dxTableScan(TestTable1);

	expect(beforeReset.items.length).toBe(10);

	await dxTableReset(TestTable1);

	const result = await dxTableScan(TestTable1);

	expect(result.items.length).toBe(0);
});
