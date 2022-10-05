import { nanoid } from 'nanoid';
import { TestTable } from '../utils';
import { A } from 'ts-toolbelt';

export const getKeyAttributesCheck: A.Equals<keyof Parameters<typeof TestTable['get']>[0]['Key'], 'pk' | 'sk'> = 1;
export const getKeyValuesCheck: A.Equals<
	Parameters<typeof TestTable['get']>[0]['Key'][keyof Parameters<typeof TestTable['get']>[0]['Key']],
	string
> = 1;

beforeEach(TestTable.reset, 10 * 1000);

it('gets a put item', async () => {
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

	await TestTable.put({
		Item: Item2
	});

	const result = await TestTable.get({
		Key
	});

	expect(result.Item).toStrictEqual(Item2);
});
