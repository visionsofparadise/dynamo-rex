import { nanoid } from 'nanoid';
import { TestTable } from '../TableTest.dev';
import { dxDeleteItem } from './deleteItem';
import { randomNumber } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { GetKeySpaceAttributes } from '../KeySpace';
import { dxReset } from './reset';

beforeEach(() => dxReset(TestTable));

it('deletes an existing item', async () => {
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

	const result = await dxDeleteItem(TestItem1KeySpace, itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('throws on deleting not existing item', async () => {
	const testString = nanoid();
	const testNumber = randomNumber();

	const item = {
		testString,
		testNumber
	};

	await dxDeleteItem(TestItem1KeySpace, item).catch(error => expect(error).toBeDefined());
});

it('returns old values', async () => {
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

	const result = await dxDeleteItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: 'allOld'
	});

	const resultTypeCheck: A.Equals<typeof result, GetKeySpaceAttributes<typeof TestItem1KeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});
