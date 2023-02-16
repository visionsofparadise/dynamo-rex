import { nanoid } from 'nanoid';
import { TestTable } from '../TestTable.dev';

beforeEach(TestTable.reset);

it('updates an item attribute', async () => {
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

	const Item2 = {
		...Key,
		test: 'test2'
	};

	await TestTable.update({
		Key,
		UpdateExpression: 'SET test = :test2',
		ExpressionAttributeValues: {
			':test2': 'test2'
		}
	});

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual(Item2);
});

it('updates an item attribute from object', async () => {
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

	const updateObject = {
		test: 'test2'
	};

	await TestTable.updateFromObject(
		{
			Key
		},
		updateObject
	);

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual({ ...Item, ...updateObject });
});

it('updates an item attribute from object using null', async () => {
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

	const updateObject = {
		test: null
	};

	await TestTable.updateFromObject(
		{
			Key
		},
		updateObject as any
	);

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual({ ...Item, ...updateObject });
});

it('updates an item attribute from object with additional query', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test',
		test2: 'test'
	};

	await TestTable.put({
		Item
	});

	const updateObject = {
		test: 'test2'
	};

	await TestTable.updateFromObject(
		{
			Key,
			UpdateExpression: 'test2 = :test2',
			ExpressionAttributeValues: {
				':test2': 'test2'
			}
		},
		updateObject
	);

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual({ ...Item, ...updateObject, test2: 'test2' });
});
