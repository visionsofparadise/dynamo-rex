import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxTableReset } from '../method/reset';
import { arrayOfLength, randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';
import { DxBatchGetCommand } from './BatchGet';

beforeEach(() => dxTableReset(TestTable1));

it('it gets 10 items', async () => {
	jest.useRealTimers();

	const items: Array<{ pk: string; sk: string; testString: string; testNumber: number }> = arrayOfLength(10).map(() => {
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
		new DxBatchGetCommand({
			requests: {
				[TABLE_NAME]: {
					keys: items.map(({ pk, sk }) => ({ pk, sk }))
				}
			}
		})
	);

	expect(result.items[TABLE_NAME].length).toBe(10);
});
