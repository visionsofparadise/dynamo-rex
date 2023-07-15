import { TestTable } from '../TestTable.dev';
import { TestItem } from './writersTestItem.dev';

beforeEach(TestTable.reset);

it('deletes an existing item', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestTable.put({
		Item: Item.item
	});

	await TestTable.get({
		Key: Item.key
	});

	const result = await TestItem.write.delete(Item.item, { ReturnValues: 'ALL_OLD' });

	expect(result.Attributes).toStrictEqual(Item.item);

	await TestTable.get({
		Key: Item.key
	}).catch(error => expect(error).toBeDefined());
});

it('throws on deleting not existing item', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestItem.write.delete(Item.item).catch(error => expect(error).toBeDefined());
});
