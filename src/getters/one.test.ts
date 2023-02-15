import { nanoid } from 'nanoid';
import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('gets one item on primary key', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const result = await TestItem.get(testItem.item);

	expect(result.item.testString).toBe(testItem.item.testString);
});

it('gets one item on index key', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const result = await TestItem.get.gsi0.one(testItem.item);

	expect(result.item.testString).toBe(testItem.item.testString);
});
