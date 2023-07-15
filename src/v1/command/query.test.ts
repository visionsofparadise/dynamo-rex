import { nanoid } from 'nanoid';
import { TestTable } from '../TableTest.dev';
import { setTimeout } from 'timers/promises';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dxQuery } from './query';
import { dxReset } from './reset';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';

beforeEach(() => dxReset(TestTable));

it('query returns list of items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const testString = nanoid();
		const testNumber = 1;

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

	const result = await dxQuery(TestItem1KeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': 'test-1'
		}
	});

	expect(result.items.length).toBe(10);
});
