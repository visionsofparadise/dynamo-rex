import { TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxTransactGet } from './transactGet';
import { dxReset } from './reset';
import { arrayOfLength, randomString } from '../util/utils';

beforeEach(() => dxReset(TestTable1));

it('it gets 10 items', async () => {
	jest.useRealTimers();

	const items = arrayOfLength(10).map(() => {
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

	const result = await dxTransactGet(
		TestTable1,
		items.map(({ pk, sk }) => {
			return { pk, sk };
		})
	);

	expect(result.length).toBe(10);
});
