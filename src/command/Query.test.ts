import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxTableReset } from '../method/reset';
import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';
import { DxQueryCommand } from './Query';
import { GenericAttributes } from '../Dx';

beforeEach(() => dxTableReset(TestTable1));

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
				TableName: TestTable1.tableName,
				Item: item
			})
		);
	}

	await setTimeout(1000);

	const result = await TestClient.send(
		new DxQueryCommand({
			tableName: TABLE_NAME,
			keyConditionExpression: 'pk = :pk',
			expressionAttributeValues: {
				':pk': 'test-1'
			}
		})
	);

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<GenericAttributes>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});
