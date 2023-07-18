import { TestTable1 } from '../TableTest.dev';
import { dxDeleteItem } from './deleteItem';
import { randomNumber, randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { dxReset } from './reset';
import { ReturnValue } from '@aws-sdk/client-dynamodb';

beforeEach(() => dxReset(TestTable1));

it('deletes an existing item', async () => {
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

	const result = await dxDeleteItem(TestItem1KeySpace, itemWithoutKeys);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('throws on deleting not existing item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const item = {
		testString,
		testNumber
	};

	await dxDeleteItem(TestItem1KeySpace, item).catch(error => expect(error).toBeDefined());
});

it('returns old values', async () => {
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

	const result = await dxDeleteItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.ALL_OLD
	});

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});
