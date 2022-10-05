import { nanoid } from 'nanoid';
import { randomNumber, RequiredAttributes, TestTable } from '../utils';
import { A } from 'ts-toolbelt';

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
}

class BaseItem<IExtend extends IBaseItem, ISIdx extends typeof TestTable.SecondaryIndex> extends TestTable.Item<
	IExtend,
	ISIdx
> {
	constructor(
		props: Omit<IExtend, 'createdAt' | 'updatedAt' | 'itemName'>,
		SelfItem: ConstructorParameters<typeof TestTable.Item<IExtend, ISIdx>>[1] & { itemName: IBaseItem['itemName'] }
	) {
		super(
			{
				...props,
				itemName: SelfItem.itemName,
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime()
			} as IExtend,
			SelfItem
		);
	}

	async onWrite() {
		super.onWrite();

		await this.set({
			...this.props,
			updatedAt: new Date().getTime()
		});
	}
}

class TestItem extends BaseItem<ITestItem, 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4'> {
	static itemName = 'TestItem';
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
	static gsi2Pk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}
	static gsi2Sk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
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
	static gsi4Sk(props: Pick<ITestItem, 'testString'>) {
		return props.testString;
	}

	constructor(props: RequiredAttributes<ITestItem, 'testString' | 'testNumber'>) {
		super(props, TestItem);
	}
}

const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

export const indexCheck: A.Equals<Parameters<typeof testItem['indexKey']>[0], 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4'> = 1;

beforeEach(TestTable.reset, 60 * 1000);

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
	expect(testItem.propsWithKeys.gsi1Sk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.props.testString}`);
});

it('gets index key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = testItem.indexKey('gsi1');

	expect(key.gsi1Pk).toBe('test');
	expect(key.gsi1Sk).toBe(`test-${testItem.props.testString}`);
});

it('gets the current updated props of an item', async () => {
	const props = { testString: nanoid(), testNumber: randomNumber() };

	const testItem = new TestItem(props);

	const newProps = { testString: nanoid() };

	await testItem.set(newProps);

	expect(testItem.props.testString).toStrictEqual(newProps.testString);
});

it('creates a new item', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testItem.props.testString);
});

it('sets and overwrites an item', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const testString = nanoid();

	await testItem.set({ testString });
	await testItem.write();

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('updates an attribute on an item', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const testString = nanoid();

	await testItem.update({ testString });

	const getItem = await TestTable.get<ITestItem & IKey>({ Key: testItem.key });

	expect(getItem.Item!.testString).toBe(testString);
});

it('deletes an item', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	await testItem.delete();

	await TestTable.get<ITestItem & IKey>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
