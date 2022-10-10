import { nanoid } from 'nanoid';
import { TestTable } from '../TestTable.dev';

beforeEach(TestTable.reset);

it('deletes an existing item', async () => {
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

	const result = await TestTable.delete({ Key, ReturnValues: 'ALL_OLD' });

	expect(result.Attributes).toStrictEqual(Item);

	await TestTable.get({
		Key
	}).catch(error => expect(error).toBeDefined());
});

it('throws on deleting not existing item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	await TestTable.delete({ Key }).catch(error => expect(error).toBeDefined());
});
