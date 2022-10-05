import { nanoid } from 'nanoid';
import { TestTable } from '../utils';

beforeEach(TestTable.reset, 10 * 1000);

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
