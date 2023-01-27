import { nanoid } from 'nanoid';
import { randomNumber, RA } from '../utils';
import { TestTable } from '../TestTable.dev';

interface IKey {
	pk: string;
	sk: string;
}

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
	static sk(data: Pick<ITestItem, 'testString'>) {
		return `test-${data.testString}`;
	}

	constructor(data: RA<ITestItem, 'testString' | 'testNumber'>) {
		super(data, TestItem);
	}
}

beforeEach(TestTable.reset);

it('gets the current data of an item', () => {
	const data = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(data);

	expect(testItem.data.testString).toBe(data.testString);
});

it('gets the current data and keys of an item', () => {
	const data = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(data);

	expect(testItem.dataWithKeys.testString).toBeDefined();
	expect(testItem.dataWithKeys.pk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.data.testString}`);
});

it('gets the current updated data of an item', async () => {
	const data = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(data);

	const newProps = { testString: nanoid() };

	await testItem.set(newProps);

	expect(testItem.data.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.data.testString);
});

it('sets and overwrites an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const testString = nanoid();

	await testItem.set({ testString });
	await testItem.write();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const initialKey = testItem.key;

	await testItem.create();

	const testString = nanoid();

	await testItem.update({ testString });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: initialKey });

	expect(getItem.Item!.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	await testItem.delete();

	await TestTable.get<ITestItem & IKey>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
