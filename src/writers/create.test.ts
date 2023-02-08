import { TestTable } from '../TestTable.dev';
import { TestItem } from './writersTestItem.dev';

beforeEach(TestTable.reset);

it('creates new item', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestItem.write.create({
		Item: Item.itemWithKeys
	});

	const result = await TestTable.get({
		Key: Item.key
	});

	expect(result.Item).toStrictEqual(Item.itemWithKeys);
});

it('throws if trying to create item that already exists', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestTable.put({
		Item: Item.itemWithKeys
	});

	await TestItem.write
		.create({
			Item: Item.itemWithKeys
		})
		.catch(error => expect(error).toBeDefined());
});
