import { nanoid } from 'nanoid';
import { randomNumber, RA } from '../utils';
import { TestTable } from '../TestTable.dev';

interface ITestItem {
	testString: string;
	testNumber: number;
}

class TestItem extends TestTable.Item<ITestItem> {
	static itemName = 'TestItem';
	static secondaryIndexes = [];

	static pk() {
		return 'test';
	}
	static sk(item: Pick<ITestItem, 'testString'>) {
		return `test-${item.testString}`;
	}

	constructor(item: RA<ITestItem, 'testString' | 'testNumber'>) {
		super(item, TestItem);
	}
}

beforeEach(TestTable.reset);

it('gets the current item', () => {
	const item = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(item);

	expect(testItem.item.testString).toBe(item.testString);
});

it('gets the current item and keys of an item', () => {
	const item = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(item);

	expect(testItem.item.testString).toBeDefined();
	expect(testItem.item.pk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.item.testString}`);
});

it('gets the current updated item', async () => {
	const item = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(item);

	const newProps = { testString: nanoid() };

	await testItem.set(newProps);

	expect(testItem.item.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const getItem = await TestTable.get<ITestItem>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.item.testString);
});

it('sets and overwrites an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const testString = nanoid();

	await testItem.set({ testString });
	await testItem.write();

	const getItem = await TestTable.get<ITestItem>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const initialKey = testItem.key;

	await testItem.create();

	const testString = nanoid();

	await testItem.update({ testString });

	const getItem = await TestTable.get<ITestItem>({ Key: initialKey });

	expect(getItem.Item!.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	await testItem.delete();

	await TestTable.get<ITestItem>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
