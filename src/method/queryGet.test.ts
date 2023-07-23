import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { dxQueryGet } from './queryGet';
import { TestTable1 } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber, randomString } from '../util/utils';
import { dxReset } from './reset';
import { A } from 'ts-toolbelt';
import { setTimeout } from 'timers/promises';

beforeEach(() => dxReset(TestTable1));

it('gets a put item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const item = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		gsi0Pk: `test-${testNumber}`,
		gsi0Sk: `test-${testString}`,
		testString,
		testNumber
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	await setTimeout(1000);

	const itemWithoutKeys = { testString, testNumber };

	const result = await dxQueryGet(TestItem1KeySpace, 'gsi0', itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});

it('throws on not found', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const itemWithoutKeys = { testString, testNumber };

	await dxQueryGet(TestItem1KeySpace, 'gsi0', itemWithoutKeys).catch(error => expect(error).toBeDefined());
});
