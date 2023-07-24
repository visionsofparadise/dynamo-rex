import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem2KeySpace } from './KeySpaceTest.dev';
import { TestTable1 } from './TableTest.dev';
import { dxOp, DxOp } from './UpdateOp';
import { dxTableReset } from './method/reset';
import { dxUpdateQuick } from './method/updateQuick';
import { randomString, randomNumber } from './util/utils';

beforeEach(() => dxTableReset(TestTable1));

it('instanceof works with abstract', () => {
	const o1 = dxOp.Value('x');

	expect((o1 as any) instanceof DxOp).toBe(true);
});

it('updates a value as a whole', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const keyParams = {
		testString,
		testNumber
	};

	const item = {
		...keyParams,
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	const updatedTestString = randomString();

	await dxUpdateQuick(TestItem2KeySpace, keyParams, {
		deep: {
			deep: dxOp.Value({
				deep: {
					testString: updatedTestString
				}
			})
		}
	});

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem2KeySpace.keyOf(keyParams)
		})
	);

	expect(Item!.deep.deep.deep.testString).toBe(updatedTestString);
});

it('increments a value', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const keyParams = {
		testString,
		testNumber
	};

	const item = {
		...keyParams,
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	await dxUpdateQuick(TestItem2KeySpace, keyParams, {
		testNumber: dxOp.Add(1)
	});

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem2KeySpace.keyOf(keyParams)
		})
	);

	expect(Item!.testNumber).toBe(item.testNumber + 1);
});

it('drecrements a value', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const keyParams = {
		testString,
		testNumber
	};

	const item = {
		...keyParams,
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	await dxUpdateQuick(TestItem2KeySpace, keyParams, {
		testNumber: dxOp.Minus(1)
	});

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem2KeySpace.keyOf(keyParams)
		})
	);

	expect(Item!.testNumber).toBe(item.testNumber - 1);
});

it('appends list at head', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const keyParams = {
		testString,
		testNumber
	};

	const item = {
		...keyParams,
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		list: ['test'],
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	await dxUpdateQuick(TestItem2KeySpace, keyParams, {
		list: dxOp.ListAppend(['test2'], 'head')
	});

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem2KeySpace.keyOf(keyParams)
		})
	);

	expect(Item!.list.length).toBe(2);
	expect(Item!.list[0]).toBe('test2');
});

it('appends list at tail', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const keyParams = {
		testString,
		testNumber
	};

	const item = {
		...keyParams,
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		list: ['test'],
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.tableName,
			Item: item
		})
	);

	await dxUpdateQuick(TestItem2KeySpace, keyParams, {
		list: dxOp.ListAppend(['test2'], 'tail')
	});

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.tableName,
			Key: TestItem2KeySpace.keyOf(keyParams)
		})
	);

	expect(Item!.list.length).toBe(2);
	expect(Item!.list[1]).toBe('test2');
});
