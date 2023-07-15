import { nanoid } from 'nanoid';
import { TestTable } from '../TableTest.dev';
import { dxUpdateItem } from './update';
import { randomNumber } from '../util/utils';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { GetKeySpaceAttributes } from '../KeySpace';
import { dxReset } from './reset';

beforeEach(() => dxReset(TestTable));

it('updates an existing item', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdateItem(TestItem1KeySpace, itemWithoutKeys, {
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	const { Item } = await TestTable.client.send(
		new GetCommand({
			TableName: TestTable.config.name,
			Key: TestItem1KeySpace.keyOf(itemWithoutKeys)
		})
	);

	expect(Item!.testNumber).toBe(updatedTestNumber);
});

it('returns all new values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdateItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: 'allNew',
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, GetKeySpaceAttributes<typeof TestItem1KeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		...itemWithoutKeys,
		testNumber: updatedTestNumber
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns all old values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdateItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: 'allOld',
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, GetKeySpaceAttributes<typeof TestItem1KeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(itemWithoutKeys);
});

it('returns updated new values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdateItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: 'updatedNew',
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<GetKeySpaceAttributes<typeof TestItem1KeySpace>>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		testNumber: updatedTestNumber
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns updated old values', async () => {
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

	const updatedTestNumber = randomNumber();

	const result = await dxUpdateItem(TestItem1KeySpace, itemWithoutKeys, {
		returnValues: 'updatedOld',
		updateExpression: 'SET testNumber = :updatedTestNumber',
		expressionAttributeValues: {
			':updatedTestNumber': updatedTestNumber
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<GetKeySpaceAttributes<typeof TestItem1KeySpace>>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		testNumber
	};

	expect(result).toStrictEqual(updatedItem);
});
