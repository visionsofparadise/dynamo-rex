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
		item: Omit<IExtend, 'createdAt' | 'updatedAt' | 'itemName'>,
		SelfItem: ConstructorParameters<typeof TestTable.Item<IExtend, ISIdxN>>[1] & { itemName: IBaseItem['itemName'] }
	) {
		super(
			{
				...item,
				itemName: SelfItem.itemName,
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime()
			} as IExtend,
			SelfItem
		);
	}

	async onPreWrite() {
		super.onPreWrite();

		this.set({
			...this.item,
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
	static sk(item: Pick<ITestItem, 'testString'>) {
		return `test-${item.testString}`;
	}
	static gsi0Pk() {
		return 'test';
	}
	static gsi0Sk(item: Pick<ITestItem, 'testString'>) {
		return `test-${item.testString}`;
	}
	static gsi1Pk(item: Pick<ITestItem, 'testNumber'>) {
		return item.testNumber;
	}
	static gsi1Sk(item: Pick<ITestItem, 'testNumber'>) {
		return item.testNumber;
	}
	static gsi2Pk(item: Pick<ITestItem, 'testString'>) {
		return item.testString;
	}
	static gsi2Sk(item: Pick<ITestItem, 'testNumber'>) {
		return item.testNumber;
	}
	static gsi3Pk(item: Pick<ITestItem, 'testNumber'>) {
		return item.testNumber;
	}
	static gsi3Sk(item: Pick<ITestItem, 'testString'>) {
		return item.testString;
	}
	static gsi4Pk(item: Pick<ITestItem, 'testString'>) {
		return item.testString;
	}
	static gsi5Pk(item: Pick<ITestItem, 'testNumber'>) {
		return item.testNumber;
	}

	constructor(item: RA<ITestItem, 'testString' | 'testNumber' | 'deep'>) {
		super(item, TestItem);
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

it('gets the current item of an item', () => {
	const item = newTestData();

	const testItem = new TestItem(item);

	expect(testItem.item.testString).toBe(item.testString);
});

it('gets the current item and keys of an item', () => {
	const item = newTestData();

	const testItem = new TestItem(item);

	expect(testItem.item.testString).toBeDefined();
	expect(testItem.item.pk).toBeDefined();
	expect(testItem.item.gsi0Sk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem(newTestData());

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.item.testString}`);
});

it('gets index key of item', () => {
	const testItem = new TestItem(newTestData());

	const key = testItem.indexKey('gsi0');

	expect(key.gsi0Pk).toBe('test');
	expect(key.gsi0Sk).toBe(`test-${testItem.item.testString}`);
});

it('gets the current updated item of an item', async () => {
	const item = newTestData();

	const testItem = new TestItem(item);

	const newProps = { testString: nanoid() };

	testItem.set(newProps);

	expect(testItem.item.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.item.testString);
});

it('sets and overwrites an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const testString = nanoid();

	testItem.set({ testString });

	await testItem.write();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item', async () => {
	const testItem = new TestItem(newTestData());

	const initialKey = testItem.key;

	await testItem.create();

	const testString = nanoid();

	await testItem.update({
		UpdateExpression: 'SET testString = :testString',
		ExpressionAttributeValues: {
			':testString': testString
		}
	});

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: initialKey });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item from object', async () => {
	const testItem = new TestItem(newTestData());

	const initialKey = testItem.key;

	await testItem.create();

	const testString = nanoid();

	await testItem.updateFromObject({ testString });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: initialKey });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates a deep attribute on an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	const testString = nanoid();

	await testItem.updateFromObject({ deep: { deep: { deep: { testString } } } });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.deep.deep.deep.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = new TestItem(newTestData());

	await testItem.create();

	await testItem.delete();

	await TestTable.get<ITestItem & IKey>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
