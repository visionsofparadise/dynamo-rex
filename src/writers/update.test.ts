import { TestTable } from '../TestTable.dev';
import { TestItem } from './writersTestItem.dev';

beforeEach(TestTable.reset);

it('updates an item attribute', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestTable.put({
		Item: Item.itemWithKeys
	});

	await TestItem.write.update(Item.item, {
		UpdateExpression: 'SET testString = :test2',
		ExpressionAttributeValues: {
			':test2': 'test2'
		}
	});

	await Item.set({
		testString: 'test2'
	});

	const result = await TestTable.get({
		Key: Item.key
	});

	expect(result.Item).toStrictEqual(Item.itemWithKeys);
});

it('updates an item attribute from object', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestTable.put({
		Item: Item.itemWithKeys
	});

	const updateObject = {
		testString: 'test2'
	};

	await TestItem.write.updateFromObject(Item.item, updateObject);

	const result = await TestTable.get({
		Key: Item.key
	});

	expect(result.Item).toStrictEqual({ ...Item.itemWithKeys, ...updateObject });
});
