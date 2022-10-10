import { nanoid } from 'nanoid';
import { TestTable } from '../TestTable.dev';

beforeEach(TestTable.reset);

it('creates new item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await TestTable.create({
		Key,
		Item
	});

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual(Item);
});

it('throws if trying to create item that already exists', async () => {
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

	await TestTable.create({
		Key,
		Item
	}).catch(error => expect(error).toBeDefined());
});
