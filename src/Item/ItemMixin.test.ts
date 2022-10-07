import { RequiredAttributes, TestTable } from '../utils';

type C<T> = {
	new (...args: any[]): T;
};

interface IBaseItem {
	itemName: string;
	createdAt: number;
	updatedAt: number;
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

class TimestampsBaseItem<
	IExtend extends ITimestamps,
	ISIdx extends typeof TestTable.SecondaryIndex | never
> extends TestTable.Item<IExtend, ISIdx> {}

interface ITimestamps {
	createdAt: number;
	updatedAt: number;
}

const mixTimestamps = <
	IExtend extends ITimestamps,
	ISIdx extends typeof TestTable.SecondaryIndex | never,
	TB extends C<TimestampsBaseItem<IExtend, ISIdx>>
>(
	Base: TB
) => {
	return class BasePlusTimestamps extends Base {
		static defaults_timestamps = (props: Partial<ITimestamps>) => {
			return {
				createdAt: props.createdAt || new Date().getTime(),
				updatedAt: props.updatedAt || new Date().getTime()
			};
		};

		async onWrite() {
			this.set({
				...this.props,
				updatedAt: new Date().getTime()
			});
		}
	};
};

interface IExtraAttribute {
	extra: string;
}

class ExtraAttributeBaseItem<
	IExtend extends ITimestamps,
	ISIdx extends typeof TestTable.SecondaryIndex | never
> extends TestTable.Item<IExtend, ISIdx> {}

const mixExtraAttribute = <
	IExtend extends ITimestamps,
	ISIdx extends typeof TestTable.SecondaryIndex | never,
	TB extends C<ExtraAttributeBaseItem<IExtend, ISIdx>>
>(
	Base: TB
) => {
	return class BasePlusExtraAttribute extends Base {
		static defaults_extra = (props: Partial<IExtraAttribute>) => {
			return {
				extra: props.extra || 'test'
			};
		};
	};
};

interface ITestItem extends ITimestamps, IExtraAttribute, IBaseItem {
	testAttribute: string;
}

class TestItem extends mixExtraAttribute(mixTimestamps(BaseItem))<ITestItem, 'gsi1'> {
	static itemName = 'TestItem';
	static secondaryIndexes = ['gsi1' as const];

	static pk() {
		return 'test';
	}
	static sk(props: Pick<ITestItem, 'testAttribute'>) {
		return `test-${props.testAttribute}`;
	}
	static gsi1Pk() {
		return 'test';
	}
	static gsi1Sk(props: Pick<ITestItem, 'testAttribute'>) {
		return `test-${props.testAttribute}`;
	}

	constructor(props: RequiredAttributes<ITestItem, 'testAttribute'>) {
		super({ ...props, ...TestItem.defaults_timestamps(props), ...TestItem.defaults_extra(props) }, TestItem);
	}

	async onWrite() {
		await super.onWrite();

		await this.set({
			testAttribute: 'test2'
		});
	}
}

beforeEach(TestTable.reset);

it('mixes timestamps and extra attribute', async () => {
	jest.useFakeTimers();

	const testItem = await new TestItem({ testAttribute: 'test' }).create();

	expect(testItem.props.createdAt).toBeDefined();
	expect(testItem.props.updatedAt).toBeDefined();
	expect(testItem.props.extra).toBeDefined();

	jest.advanceTimersByTime(1000);

	await testItem.write();

	expect(testItem.props.updatedAt).toBeGreaterThan(testItem.props.createdAt);
	expect(testItem.props.testAttribute).toBe('test2');
});
