import { nanoid } from 'nanoid';
import { randomNumber, TestTable } from '../utils';
import { A } from 'ts-toolbelt';

interface ITestItem {
	testString: string;
	testNumber: number;
}

class TestItem extends TestTable.Item<ITestItem, 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4'> {
	static secondaryIndexes = ['gsi1' as const, 'gsi2' as const, 'gsi3' as const, 'gsi4' as const];

	static pk() {
		return 'test';
	}
	static sk(props: Pick<ITestItem, 'testString'>) {
		return `test-${props.testString}`;
	}
	static gsi1Pk() {
		return 'test';
	}
	static gsi1Sk(props: Pick<ITestItem, 'testString'>) {
		return `test-${props.testString}`;
	}
	static gsi2Pk() {
		return randomNumber();
	}
	static gsi2Sk() {
		return randomNumber();
	}
	static gsi3Pk(props: Pick<ITestItem, 'testString'>) {
		return props.testString;
	}
	static gsi3Sk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}
	static gsi4Pk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}
	static gsi4Sk() {
		return nanoid();
	}

	static get = TestTable.getters(TestItem);

	constructor(props: ITestItem) {
		super(props, TestItem);
	}
}

export const primaryKeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['keyOf']>[0],
	Pick<ITestItem, 'testString'>
> = 1;
export const gsi2KeyParamsCheck: A.Equals<Parameters<typeof TestItem['get']['gsi2']['keyOf']>[0], never> = 1;
export const gsi3KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi3']['keyOf']>[0],
	Pick<ITestItem, 'testString'> & Pick<ITestItem, 'testNumber'>
> = 1;
export const gsi4KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi4']['keyOf']>[0],
	Pick<ITestItem, 'testNumber'>
> = 1;

afterEach(TestTable.reset, 10 * 1000);

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = TestItem.get.keyOf(testItem.props);

	expect(key).toStrictEqual(testItem.key);
});

it('gets one item on primary key', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const result = await TestItem.get(testItem.props);

	expect(result.props.testString).toBe(testItem.props.testString);
});

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.query().hashKey();

	expect(result.Items.length).toBe(3);
});

it('queries items with startsWith on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with between on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.query().between({ Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});

it('gets index key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = TestItem.get.gsi1.keyOf(testItem.props);

	expect(key).toStrictEqual(testItem.indexKey('gsi1'));
});

it('gets one item on index key', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const result = await TestItem.get.gsi1.one(testItem.props);

	expect(result.props.testString).toBe(testItem.props.testString);
});

it('queries items with hashKey on index key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.gsi1.query().hashKey();

	expect(result.Items.length).toBe(3);
});

it('queries items with startsWith on index key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.gsi1.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with between on index key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.gsi1.query().between({ Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 20; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.queryAll().hashKey({ Limit: 5 });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBe(5);
});

it('queries items with startsWith on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.queryAll().startsWith({ Limit: 5, StartsWith: 'test-1' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBe(5);
});

it('queries items with between on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	const result = await TestItem.get.queryAll().between({ Limit: 5, Min: 'test-190', Max: 'test-209' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBe(4);
});
