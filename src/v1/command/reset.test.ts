import { nanoid } from 'nanoid';
import { dxScan } from './scan';
import { TestTable } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { dxReset } from './reset';
import { randomNumber } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

beforeEach(() => dxReset(TestTable));

it('reset deletes all items', async () => {
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

	const beforeReset = await dxScan(TestTable);

	expect(beforeReset.items.length).toBe(10);

	await dxReset(TestTable);

	const result = await dxScan(TestTable);

	expect(result.items.length).toBe(0);
});
