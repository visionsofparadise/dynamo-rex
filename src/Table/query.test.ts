import { nanoid } from 'nanoid';
import wait from 'wait';
import { A } from 'ts-toolbelt';
import { TestTable } from '../TestTable.dev';

export const indexNameCheck: A.Equals<
	Parameters<typeof TestTable['query']>[0]['IndexName'],
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5' | undefined
> = 1;

beforeEach(TestTable.reset);

it('query returns list of items', async () => {
	jest.useRealTimers();

	const Item = {
		test: 'test'
	};

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		await TestTable.put({
			Item: { ...Key, ...Item }
		});
	}

	await wait(1000);

	const result = await TestTable.query<typeof Item, never, never>({
		KeyConditionExpression: `pk = :pk`,
		ExpressionAttributeValues: {
			':pk': 'test'
		}
	});

	expect(result.Items.length).toBe(10);
});

it('query on index returns list of items with all keys projection', async () => {
	jest.useRealTimers();

	interface ITestItem {
		test: string;
		test2: string;
	}

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const IndexKey = {
			gsi0Pk: 'test',
			gsi0Sk: nanoid()
		};

		const Item = {
			...Key,
			...IndexKey,
			test: 'test',
			test2: 'test2'
		};

		await TestTable.put({
			Item
		});
	}

	await wait(1000);

	const result = await TestTable.query<ITestItem, 'gsi0', 'gsi0'>({
		IndexName: 'gsi0',
		KeyConditionExpression: `gsi0Pk = :gsi0Pk`,
		ExpressionAttributeValues: {
			':gsi0Pk': 'test'
		}
	});

	const allProjectionCheck: A.Equals<
		typeof result['Items'][number],
		ITestItem & typeof TestTable['PrimaryIndexKey'] & typeof TestTable['SecondaryIndexKeyM']['gsi0']
	> = 1;

	expect(allProjectionCheck).toBe(1);
	expect(result.Items.length).toBe(10);
	expect(result.Items[0].test).toBe('test');
	expect(result.Items[0].test2).toBe('test2');
});

it('query on index returns list of items with keys only projection', async () => {
	jest.useRealTimers();

	interface ITestItem {
		testString: string;
		testNumber: number;
	}

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const IndexKey = {
			gsi1Pk: 100 + i,
			gsi1Sk: 100 + i
		};

		const Item = {
			...Key,
			...IndexKey,
			testString: 'test',
			testNumber: 5
		};

		await TestTable.put({
			Item
		});
	}

	await wait(1000);

	const result = await TestTable.query<ITestItem, 'gsi1', 'gsi1'>({
		IndexName: 'gsi1',
		KeyConditionExpression: `gsi1Pk = :gsi1Pk`,
		ExpressionAttributeValues: {
			':gsi1Pk': 100
		}
	});

	const keysOnlyProjectionCheck: A.Equals<
		typeof result['Items'][number],
		typeof TestTable['PrimaryIndexKey'] & typeof TestTable['SecondaryIndexKeyM']['gsi1'] & Pick<ITestItem, never>
	> = 1;

	expect(keysOnlyProjectionCheck).toBe(1);
	expect(result.Items.length).toBe(1);
});

it('query on index returns list of items with attribute projection', async () => {
	jest.useRealTimers();

	interface ITestItem {
		testString: string;
		testNumber: number;
	}

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const IndexKey = {
			gsi2Pk: 'test',
			gsi2Sk: i
		};

		const Item = {
			...Key,
			...IndexKey,
			testString: 'test',
			testNumber: 5
		};

		await TestTable.put({
			Item
		});
	}

	await wait(1000);

	const result = await TestTable.query<ITestItem, 'gsi2', 'gsi2'>({
		IndexName: 'gsi2',
		KeyConditionExpression: `gsi2Pk = :gsi2Pk`,
		ExpressionAttributeValues: {
			':gsi2Pk': 'test'
		}
	});

	const projectionCheck: A.Equals<
		typeof result['Items'][number],
		typeof TestTable['PrimaryIndexKey'] & typeof TestTable['SecondaryIndexKeyM']['gsi2'] & Pick<ITestItem, 'testString'>
	> = 1;

	expect(projectionCheck).toBe(1);
	expect(result.Items.length).toBe(10);
});
