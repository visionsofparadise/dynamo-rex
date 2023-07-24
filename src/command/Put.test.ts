import { A } from 'ts-toolbelt';
import { randomNumber, randomString } from '../util/utils';
import { dxTableReset } from '../method/reset';
import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestClient } from '../ClientTest.dev';
import { DxPutCommand } from './Put';

beforeEach(() => dxTableReset(TestTable1));

it('puts new item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const item = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		testString,
		testNumber
	};

	const result = await TestClient.send(
		new DxPutCommand({
			tableName: TABLE_NAME,
			item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
});

it('puts over existing item', async () => {
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
			TableName: TABLE_NAME,
			Item: item
		})
	);

	const result = await TestClient.send(
		new DxPutCommand({
			tableName: TABLE_NAME,
			item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
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
			TableName: TABLE_NAME,
			Item: item
		})
	);

	const updatedItem = {
		...item,
		optionalString: randomString()
	};

	const result = await TestClient.send(
		new DxPutCommand({
			tableName: TABLE_NAME,
			item: updatedItem,
			returnValues: ReturnValue.ALL_OLD
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], typeof updatedItem> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toStrictEqual(item);
});
