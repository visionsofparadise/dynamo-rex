import { TestTable1 } from '../TableTest.dev';
import { dxUpdate } from './update';
import { randomNumber, randomString } from '../util/utils';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { dxTableReset } from './reset';
import { ReturnValue } from '@aws-sdk/client-dynamodb';

beforeEach(() => dxTableReset(TestTable1));

it('updates an existing item', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdate(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.NONE,
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem1KeySpace.keyOf(itemWithoutKeys)
		})
	);

	expect(Item!.testNumber).toBe(updatedTestNumber);
});

it('returns all new values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdate(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.ALL_NEW,
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		...itemWithoutKeys,
		testNumber: updatedTestNumber
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns all old values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdate(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.ALL_OLD,
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});

it('returns updated new values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdate(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.UPDATED_NEW,
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<(typeof TestItem1KeySpace)['Attributes']>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		testNumber: updatedTestNumber
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns updated old values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdate(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: ReturnValue.UPDATED_OLD,
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<(typeof TestItem1KeySpace)['Attributes']>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		testNumber
	};

	expect(result).toStrictEqual(updatedItem);
});
