import { nanoid } from 'nanoid';
import { TestTable } from '../TestTable.dev';

it('gets a batch of items', async () => {
	const Key1 = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item1 = {
		...Key1,
		test: 'test'
	};

	await TestTable.put({
		Item: Item1
	});

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

	const result = await TestTable.batchGet([Key1, Key2]);

	expect(result[0].Responses![TestTable.config.name].length).toBe(2);
});
