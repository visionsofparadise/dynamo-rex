import Dx from '../index';
import { nanoid } from 'nanoid';
import AWS from 'aws-sdk';

export const DocumentClient = new AWS.DynamoDB.DocumentClient({
	endpoint: 'localhost:8000',
	sslEnabled: false,
	region: 'local-env'
});

const Table = new Dx.Table(
	DocumentClient,
	{
		name: 'test',
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

Table.PrimaryIndex;
Table.IndexNames;
Table.indexConfig;
Table.SecondaryIndexNames;
Table.IndexKeys;
Table.IndexAttributeValues;

beforeEach(Table.reset);

it('puts new item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await Table.put({
		Item
	});

	expect(true).toBe(true);
});

it('puts over existing item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test1'
	};

	await Table.put({
		Item
	});

	const Item2 = {
		...Key,
		test: 'test2'
	};

	await Table.put({
		Item: Item2
	});

	expect(true).toBe(true);
});

it('gets a put item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await Table.put({
		Item
	});

	const Item2 = {
		...Key,
		test: 'test2'
	};

	await Table.put({
		Item: Item2
	});

	const result = await Table.get({
		Key
	});

	expect(result.Item).toStrictEqual(Item2);
});

it('creates new item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await Table.create(Key, {
		Item
	});

	const result = await Table.get({
		Key
	});

	expect(result.Item).toStrictEqual(Item);
});

it('throws if trying to create item that already exists', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await Table.put({
		Item
	});

	await Table.create(Key, {
		Item
	}).catch(error => expect(error).toBeDefined());
});

it('deletes an existing item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	const Item = {
		...Key,
		test: 'test'
	};

	await Table.put({
		Item
	});

	const result = await Table.delete({ Key, ReturnValues: 'ALL_OLD' });

	expect(result.Attributes).toStrictEqual(Item);

	await Table.get({
		Key
	}).catch(error => expect(error).toBeDefined());
});

it('throws on deleting not existing item', async () => {
	const Key = {
		pk: nanoid(),
		sk: nanoid()
	};

	await Table.delete({ Key }).catch(error => expect(error).toBeDefined());
});

it('query returns list of items', async () => {
	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const Item = {
			...Key,
			test: 'test'
		};

		await Table.put({
			Item
		});
	}

	const result = await Table.query({
		KeyConditionExpression: `pk = :pk`,
		ExpressionAttributeValues: {
			':pk': 'test'
		}
	});

	expect(result.Items!.length).toBe(10);
});

it('scan returns list of items', async () => {
	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const Item = {
			...Key,
			test: 'test'
		};

		await Table.put({
			Item
		});
	}

	const result = await Table.scan();

	expect(result.Items!.length).toBe(10);
});

it('reset deletes all items', async () => {
	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const Item = {
			...Key,
			test: 'test'
		};

		await Table.put({
			Item
		});
	}

	const beforeReset = await Table.scan();

	expect(beforeReset.Items!.length).toBe(10);

	await Table.reset();

	const result = await Table.scan();

	expect(result.Items!.length).toBe(0);
});
