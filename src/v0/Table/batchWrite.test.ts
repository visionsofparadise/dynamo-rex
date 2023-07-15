import { nanoid } from 'nanoid';
import { TestTable } from '../TestTable.dev';

it('writes a batch of items', async () => {
	const Key1 = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item1 = {
		...Key1,
		test: 'test'
	};

	const Key2 = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item2 = {
		...Key2,
		test: 'test'
	};

	await TestTable.put({
		Item: Item2
	});

	const result = await TestTable.batchWrite([
		{
			PutRequest: {
				Item: Item1
			}
		},
		{
			DeleteRequest: {
				Key: Key2
			}
		}
	]);

	expect(result[0].UnprocessedItems).toStrictEqual({});
});
