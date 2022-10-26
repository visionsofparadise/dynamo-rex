import { nanoid } from 'nanoid';
import { TestTable } from './Table2';
import { A } from 'ts-toolbelt';

beforeEach(TestTable.reset);

it('puts new item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await TestTable.put({
		Item
	});

	expect(true).toBe(true);
});

it('puts over existing item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test1'
	};

	await TestTable.put({
		Item
	});

	const Item2 = {
		...Key,
		test: 'test2'
	};

	const result = await TestTable.put({
		Item: Item2
	});

	const putItemReturnValuesCheck: A.Equals<typeof result['Attributes'], never> = 1;

	expect(putItemReturnValuesCheck).toBe(1);
	expect(result.Attributes).toBe(undefined);
});

it('puts over existing item and returns old values', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test1'
	};

	await TestTable.put({
		Item
	});

	const Item2 = {
		...Key,
		test: 'test2'
	};

	const result = await TestTable.put({
		Item: Item2,
		ReturnValues: 'ALL_OLD'
	});

	const putItemReturnValuesCheck: A.Extends<typeof result['Attributes'], typeof Item> = 1;

	expect(putItemReturnValuesCheck).toBe(1);
	expect(result.Attributes).toStrictEqual(Item);
});
