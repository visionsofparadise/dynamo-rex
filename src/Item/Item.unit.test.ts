import Dx from '../index';
import { nanoid } from 'nanoid';
import AWS from 'aws-sdk';

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

interface ITestItem {
	testAttribute: string;
}

class TestItem extends Table.Item<ITestItem, 'gsi1'> {
	static secondaryIndices = [Table.indices.gsi1];

	static pk = () => 'test';
	static sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;
	static gsi1Pk = () => 'test';
	static gsi1Sk = (props: Pick<ITestItem, 'testAttribute'>) => `test-${props.testAttribute}`;

	constructor(props: Omit<ITestItem, 'createdAt'>) {
		super(props, TestItem);
	}
}

beforeEach(Table.reset);

it('gets the current props of an item', () => {
	const props = { testAttribute: nanoid() };

	const testItem = new TestItem(props);

	expect(testItem.props.testAttribute).toBe(props.testAttribute);
});

it('gets the current props and keys of an item', () => {
	const props = { testAttribute: nanoid() };

	const testItem = new TestItem(props);

	expect(testItem.propsWithKeys.testAttribute).toBeDefined();
	expect(testItem.propsWithKeys.pk).toBeDefined();
	expect(testItem.propsWithKeys.gsi1Sk).toBeDefined();
});

it('gets primary key of item', () => {
	const testItem = new TestItem({ testAttribute: nanoid() });

	const key = testItem.key;

	expect(key.pk).toBe('test');
	expect(key.sk).toBe(`test-${testItem.props.testAttribute}`);
});

it('gets index key of item', () => {
	const testItem = new TestItem({ testAttribute: nanoid() });

	const key = testItem.indexKey('gsi1');

	expect(key.gsi1Pk).toBe('test');
	expect(key.gsi1Sk).toBe(`test-${testItem.props.testAttribute}`);
});

it('gets the current updated props of an item', async () => {
	const props = { testAttribute: nanoid() };

	const testItem = new TestItem(props);

	const newProps = { testAttribute: nanoid() };

	await testItem.set(newProps);

	expect(testItem.props.testAttribute).toStrictEqual(newProps.testAttribute);
});

it('creates a new item', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	const getItem = await Table.get<ITestItem>({ Key: testItem.key });

	expect(getItem.Item!.testAttribute).toBe(testItem.props.testAttribute);
});

it('sets and overwrites an item', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	const testAttribute = nanoid();

	await testItem.set({ testAttribute });
	await testItem.write();

	const getItem = await Table.get<ITestItem>({ Key: testItem.key });

	expect(getItem.Item!.testAttribute).toBe(testAttribute);
});

it('updates an attribute on an item', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	const testAttribute = nanoid();

	await testItem.update({ testAttribute });

	const getItem = await Table.get<ITestItem>({ Key: testItem.key });

	expect(getItem.Item!.testAttribute).toBe(testAttribute);
});

it('deletes an item', async () => {
	const testItem = await new TestItem({ testAttribute: nanoid() }).create();

	await testItem.delete();

	await Table.get<ITestItem>({ Key: testItem.key }).catch(error => expect(error).toBeDefined());
});
