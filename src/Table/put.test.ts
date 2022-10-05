import { nanoid } from 'nanoid';
import { TestTable } from '../utils';
import { A } from 'ts-toolbelt';

export const putItemCheck: A.Extends<Parameters<typeof TestTable['put']>[0]['Item'], { pk: string; sk: string }> = 1;

beforeEach(TestTable.reset, 10 * 1000);

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

	await TestTable.put({
		Item: Item2
	});

	expect(true).toBe(true);
});
