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
	static sk(props: Pick<ITestItem, 'testString'>) {
		return `test-${props.testString}`;
	}

	constructor(props: RA<ITestItem, 'testString' | 'testNumber'>) {
		super(props, TestItem);
	}
}

beforeEach(TestTable.reset);

it('gets the current props of an item', () => {
	const props = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(props);

	expect(testItem.props.testString).toBe(props.testString);
});

it('gets the current props and keys of an item', () => {
	const props = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(props);

	expect(testItem.propsWithKeys.testString).toBeDefined();
	expect(testItem.propsWithKeys.pk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.props.testString}`);
});

it('gets the current updated props of an item', async () => {
	const props = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(props);

	const newProps = { testString: nanoid() };

	await testItem.set(newProps);

	expect(testItem.props.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.props.testString);
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

	await testItem.create();

	const testString = nanoid();

	await testItem.update({ testString });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	await testItem.create();

	await testItem.delete();

	await TestTable.get<ITestItem & IKey>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
