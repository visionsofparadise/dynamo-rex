import AWS from 'aws-sdk';
import Dx from '../index';

type C<T> = {
	new (...args: any[]): T;
};

type RA<A extends object, P extends keyof A> = Pick<A, P> & Partial<Omit<A, P>>;
// type OA<A extends object, P extends keyof A> = Omit<A, P> & Partial<Pick<A, P>>;

export const DocumentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const Table = new Dx.Table(DocumentClient, {
	name: 'test',
	primaryIndex: 'primary',
	indices: {
		primary: new Dx.Index('primary', {
			hashKey: {
				attribute: 'pk',
				type: 'S'
			},
			rangeKey: {
				attribute: 'sk',
				type: 'S'
			}
		}),
		gsi1: new Dx.Index('gsi1', {
			hashKey: {
				attribute: 'gsi1Pk',
				type: 'S'
			},
			rangeKey: {
				attribute: 'gsi1Sk',
				type: 'S'
			}
		}),
		gsi2: new Dx.Index('gsi2', {
			hashKey: {
				attribute: 'gsi2Pk',
				type: 'S'
			},
			rangeKey: {
				attribute: 'gsi2Sk',
				type: 'S'
			}
		})
	}
});

Table.SecondaryIndex;

class TimestampsBaseItem extends Table.Item<ITimestamps, typeof Table.SecondaryIndex> {}

interface ITimestamps {
	createdAt: number;
	updatedAt: number;
}

const mixTimestamps = <TB extends C<TimestampsBaseItem>>(Base: TB) => {
	return class BasePlusTimestamps extends Base {
		static defaults_timestamps = (props: Partial<{ createdAt: number; updatedAt: number }>) => {
			return {
				createdAt: props.createdAt || new Date().getTime(),
				updatedAt: props.updatedAt || new Date().getTime()
			};
		};

		onWrite = async () => {
			this.set({
				updatedAt: new Date().getTime()
			});
		};

		onWrite_timestamps = this.onWrite;
	};
};

interface IExtraAttribute {
	extra: string;
}

class ExtraAttributeBaseItem extends Table.Item<IExtraAttribute, typeof Table.SecondaryIndex> {}

const mixExtraAttribute = <TB extends C<ExtraAttributeBaseItem>>(Base: TB) => {
	return class BasePlusExtraAttribute extends Base {
		static defaults_extra = (props: Partial<{ extra: string }>) => {
			return {
				extra: props.extra || 'test'
			};
		};
	};
};

interface ITestItem extends ITimestamps, IExtraAttribute {
	testAttribute: string;
}

class TestItemBase extends Table.Item<ITestItem, 'gsi1'> {}

class TestItem extends mixExtraAttribute(mixTimestamps(TestItemBase)) {
	static secondaryIndices = [Table.indices.gsi1];

	static pk = () => 'test';
	static sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;
	static gsi1Pk = () => 'test';
	static gsi1Sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;

	constructor(props: RA<ITestItem, 'testAttribute'>) {
		super({ ...props, ...TestItem.defaults_timestamps(props), ...TestItem.defaults_extra(props) }, TestItem);
	}

	onWrite = async () => {
		await this.onWrite_timestamps();

		await this.set({
			testAttribute: 'test2'
		});
	};
}

beforeEach(Table.reset);

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
