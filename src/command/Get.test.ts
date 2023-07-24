import { TABLE_NAME, TestTable1 } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber, randomString } from '../util/utils';
import { dxTableReset } from '../method/reset';
import { A } from 'ts-toolbelt';
import { TestClient } from '../ClientTest.dev';
import { GenericAttributes } from '../Dx';
import { DxGetCommand } from './Get';

beforeEach(() => dxTableReset(TestTable1));

it('gets a put item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const key = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`
	};

	const item = {
		...key,
		testString,
		testNumber
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	const result = await TestClient.send(
		new DxGetCommand({
			tableName: TABLE_NAME,
			key
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['item'], GenericAttributes> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.item).toStrictEqual(item);
});

it('throws on not found', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const key = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`
	};

	await TestClient.send(
		new DxGetCommand({
			tableName: TABLE_NAME,
			key
		})
	).catch(error => expect(error).toBeDefined());
});
