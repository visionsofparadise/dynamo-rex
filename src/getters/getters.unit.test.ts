import Dx from '../index';
import { nanoid } from 'nanoid';
import AWS from 'aws-sdk';

export const DocumentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const Table = new Dx.Table(
	{
		name: 'test',
		client: DocumentClient,
		primaryIndex: 'primary'
	},
	{
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
);

interface ITestItem {
	testAttribute: string;
}

class TestItem extends Table.Item(['gsi1' as const])<ITestItem> {
	static pk = () => 'test';
	static sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;
	static gsi1Pk = () => 'test';
	static gsi1Sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;

	static get = Table.getters(TestItem);

	constructor(props: ITestItem) {
		super(props, TestItem);
	}
}

beforeEach(Table.reset);

it('gets primary key of item', () => {
	const testItem = new TestItem({ testAttribute: nanoid() });

	const key = TestItem.get.keyOf(testItem.props);

	expect(key).toStrictEqual(testItem.key);
});

it('gets one item on primary key', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	const result = await TestItem.get(testItem.props);

	expect(result.props.testAttribute).toBe(testItem.props.testAttribute);
});

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.query().hashKey();

	expect(result.Items.length).toBe(3);
});

it('queries items with startsWith on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with between on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.query().between({ Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});

it('gets index key of item', () => {
	const testItem = new TestItem({ testAttribute: nanoid() });

	const key = TestItem.get.gsi1.keyOf(testItem.props);

	expect(key).toStrictEqual(testItem.indexKey('gsi1'));
});

it('gets one item on index key', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	const result = await TestItem.get.gsi1.one(testItem.props);

	expect(result.props.testAttribute).toBe(testItem.props.testAttribute);
});

it('queries items with hashKey on index key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.gsi1.query().hashKey();

	expect(result.Items.length).toBe(3);
});

it('queries items with startsWith on index key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.gsi1.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with between on index key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.gsi1.query().between({ Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 20; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.queryAll().hashKey({ Limit: 5 });

	expect(result.Items.length).toBe(20);
	expect(result.Pages.length).toBe(5);
});

it('queries items with startsWith on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.queryAll().startsWith({ Limit: 5, StartsWith: 'test-1' });

	expect(result.Items.length).toBe(20);
	expect(result.Pages.length).toBe(5);
});

it('queries items with between on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		await new TestItem({ testAttribute: String(i) }).create();
	}

	const result = await TestItem.get.queryAll().between({ Limit: 5, Min: 'test-190', Max: 'test-209' });

	expect(result.Items.length).toBe(20);
	expect(result.Pages.length).toBe(4);
});
