import { nanoid } from 'nanoid';
import { randomNumber, RA } from '../utils';
import { A } from 'ts-toolbelt';
import { TestTable } from '../TestTable.dev';

interface IKey {
	pk: string;
	sk: string;
}

interface IBaseItem {
	itemName: string;
	createdAt: number;
	updatedAt: number;
}

interface ITestItem extends IBaseItem {
	testString: string;
	testNumber: number;
	deep: {
		deep: {
			deep: {
				testString: string;
			};
		};
	};
}

class BaseItem<IExtend extends IBaseItem, ISIdxN extends typeof TestTable.SecondaryIndex> extends TestTable.Item<
	IExtend,
	ISIdxN
> {
	constructor(
		data: Omit<IExtend, 'createdAt' | 'updatedAt' | 'itemName'>,
		SelfItem: ConstructorParameters<typeof TestTable.Item<IExtend, ISIdxN>>[1] & { itemName: IBaseItem['itemName'] }
	) {
		super(
			{
				...data,
				itemName: SelfItem.itemName,
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime()
			} as IExtend,
			SelfItem
		);
	}

	async onPreWrite() {
		super.onPreWrite();

		await this.set({
			...this.data,
			updatedAt: new Date().getTime()
		});
	}
}

class TestItem extends BaseItem<ITestItem, 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'> {
	static itemName = 'TestItem';
	static secondaryIndexes = [
		'gsi0' as const,
		'gsi1' as const,
		'gsi2' as const,
		'gsi3' as const,
		'gsi4' as const,
		'gsi5' as const
	];

	static pk() {
		return 'test';
	}
	static sk(data: Pick<ITestItem, 'testString'>) {
		return `test-${data.testString}`;
	}
	static gsi0Pk() {
		return 'test';
	}
	static gsi0Sk(data: Pick<ITestItem, 'testString'>) {
		return `test-${data.testString}`;
	}
	static gsi1Pk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi1Sk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi2Pk(data: Pick<ITestItem, 'testString'>) {
		return data.testString;
	}
	static gsi2Sk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi3Pk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi3Sk(data: Pick<ITestItem, 'testString'>) {
		return data.testString;
	}
	static gsi4Pk(data: Pick<ITestItem, 'testString'>) {
		return data.testString;
	}
	static gsi5Pk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}

	constructor(data: RA<ITestItem, 'testString' | 'testNumber' | 'deep'>) {
		super(data, TestItem);
	}
}

const newTestData = () => ({
	testString: nanoid(),
	testNumber: randomNumber(),
	deep: { deep: { deep: { testString: nanoid() } } }
});

const newTestItem = new TestItem(newTestData());

export const indexCheck: A.Equals<
	Parameters<typeof newTestItem['indexKey']>[0],
	'primary' | 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

beforeEach(TestTable.reset);

it('gets the current data of an item', () => {
	const data = newTestData();

	const testItem = new TestItem(data);

	expect(testItem.data.testString).toBe(data.testString);
});

it('gets the current data and keys of an item', () => {
	const data = newTestData();

	const testItem = new TestItem(data);

	expect(testItem.dataWithKeys.testString).toBeDefined();
	expect(testItem.dataWithKeys.pk).toBeDefined();
	expect(testItem.dataWithKeys.gsi0Sk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem(newTestData());

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.data.testString}`);
});

it('gets index key of item', () => {
	const testItem = new TestItem(newTestData());

	const key = testItem.indexKey('gsi0');

	expect(key.gsi0Pk).toBe('test');
	expect(key.gsi0Sk).toBe(`test-${testItem.data.testString}`);
});

it('gets the current updated data of an item', async () => {
	const data = newTestData();

	const testItem = new TestItem(data);

	const newProps = { testString: nanoid() };

	await testItem.set(newProps);

	expect(testItem.data.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.data.testString);
});

it('sets and overwrites an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const testString = nanoid();

	await testItem.set({ testString });
	await testItem.write();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item', async () => {
	const testItem = new TestItem(newTestData());

	const initialKey = testItem.key;

	await testItem.create();

	const testString = nanoid();

	await testItem.update({ testString });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: initialKey });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates a deep attribute on an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const testString = nanoid();

	await testItem.update({ deep: { deep: { deep: { testString } } } });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.deep.deep.deep.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	await testItem.delete();

	await TestTable.get<ITestItem & IKey>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
