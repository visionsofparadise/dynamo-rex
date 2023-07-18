import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { dxGetItem } from './getItem';
import { TestTable1 } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber, randomString } from '../util/utils';
import { dxReset } from './reset';
import { A } from 'ts-toolbelt';

beforeEach(() => dxReset(TestTable1));

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
			TableName: TestTable1.config.name,
			Item: item
		})
	);

	const itemWithoutKeys = { testString, testNumber };

	const result = await dxGetItem(TestItem1KeySpace, itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});
