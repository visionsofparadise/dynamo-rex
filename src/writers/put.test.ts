import { TestTable } from '../TestTable.dev';
import { A } from 'ts-toolbelt';
import { TestItem } from './writersTestItem.dev';

beforeEach(TestTable.reset);

it('puts new item', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestItem.write.put({
		Item: Item.item
	});

	expect(true).toBe(true);
});

it('puts over existing item', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	await TestTable.put({
		Item: Item.item
	});

	Item.set({
		testString: 'test2'
	});

	const result = await TestItem.write.put({
		Item: Item.item
	});

	const putItemReturnValuesCheck: A.Equals<typeof result['Attributes'], never> = 1;

	expect(putItemReturnValuesCheck).toBe(1);
	expect(result.Attributes).toBe(undefined);
});

it('puts over existing item and returns old values', async () => {
	const Item = new TestItem({
		testString: 'test',
		testNumber: 100
	});

	const originalItem = Item.item;

	await TestTable.put({
		Item: Item.item
	});

	Item.set({
		testString: 'test2'
	});

	const result = await TestItem.write.put({
		Item: Item.item,
		ReturnValues: 'ALL_OLD'
	});

	const putItemReturnValuesCheck: A.Extends<typeof result['Attributes'], typeof Item['item']> = 1;

	expect(putItemReturnValuesCheck).toBe(1);
	expect(result.Attributes).toStrictEqual(originalItem);
});
