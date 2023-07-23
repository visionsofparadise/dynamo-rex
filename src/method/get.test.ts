import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { dxGet } from './get';
import { TestTable1 } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber, randomString } from '../util/utils';
import { dxTableReset } from './reset';
import { A } from 'ts-toolbelt';

beforeEach(() => dxTableReset(TestTable1));

it('gets a put item', async () => {
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

	const itemWithoutKeys = { testString, testNumber };

	const result = await dxGet(TestItem1KeySpace, itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});
