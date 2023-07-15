import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { dxGetItem } from './getItem';
import { TestTable } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber } from '../util/utils';
import { nanoid } from 'nanoid';
import { dxReset } from './reset';
import { GetKeySpaceAttributes } from '../KeySpace';
import { A } from 'ts-toolbelt';

beforeEach(() => dxReset(TestTable));

it('gets a put item', async () => {
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

	const itemWithoutKeys = { testString, testNumber };

	const result = await dxGetItem(TestItem1KeySpace, itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, GetKeySpaceAttributes<typeof TestItem1KeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});
