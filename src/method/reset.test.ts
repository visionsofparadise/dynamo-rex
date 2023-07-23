import { dxScan } from './scan';
import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { dxReset } from './reset';
import { randomNumber, randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

beforeEach(() => dxReset(TestTable1));

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

	const beforeReset = await dxScan(TestTable1);

	expect(beforeReset.items.length).toBe(10);

	await dxReset(TestTable1);

	const result = await dxScan(TestTable1);

	expect(result.items.length).toBe(0);
});
