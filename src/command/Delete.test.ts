import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { randomNumber, randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { A } from 'ts-toolbelt';
import { dxTableReset } from '../method/reset';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxDeleteCommand } from './Delete';
import { TestClient } from '../ClientTest.dev';
import { GenericAttributes } from '../Dx';

beforeEach(() => dxTableReset(TestTable1));

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
			TableName: TABLE_NAME,
			Item: item
		})
	);

	const { pk, sk } = item;

	const result = await TestClient.send(
		new DxDeleteCommand({
			tableName: TABLE_NAME,
			key: { pk, sk }
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
});

it('throws on deleting not existing item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const key = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`
	};

	await TestClient.send(
		new DxDeleteCommand({
			tableName: TABLE_NAME,
			key
		})
	).catch(error => expect(error).toBeDefined());
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

	const { pk, sk } = item;

	const result = await TestClient.send(
		new DxDeleteCommand({
			tableName: TABLE_NAME,
			key: { pk, sk },
			returnValues: ReturnValue.ALL_OLD
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], GenericAttributes> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toStrictEqual(item);
});
