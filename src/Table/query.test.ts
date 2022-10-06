import { nanoid } from 'nanoid';
import { TestTable, wait } from '../utils';
import { A } from 'ts-toolbelt';

export const indexNameCheck: A.Equals<
	Parameters<typeof TestTable['query']>[0]['IndexName'],
	'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5' | 'gsi6' | undefined
> = 1;

beforeEach(TestTable.reset);

it('query returns list of items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const Item = {
			...Key,
			test: 'test'
		};

		await TestTable.put({
			Item
		});
	}

	await wait(1000);

	const result = await TestTable.query({
		KeyConditionExpression: `pk = :pk`,
		ExpressionAttributeValues: {
			':pk': 'test'
		}
	});

	expect(result.Items!.length).toBe(10);
});

it('query on index returns list of items', async () => {
	jest.useRealTimers();

	for (let i = 0; i < 10; i++) {
		const Key = {
			pk: 'test',
			sk: nanoid()
		};

		const IndexKey = {
			gsi1Pk: 'test',
			gsi1Sk: nanoid()
		};

		const Item = {
			...Key,
			...IndexKey,
			test: 'test'
		};

		await TestTable.put({
			Item
		});
	}

	await wait(1000);

	const result = await TestTable.query({
		IndexName: 'gsi1',
		KeyConditionExpression: `gsi1Pk = :gsi1Pk`,
		ExpressionAttributeValues: {
			':gsi1Pk': 'test'
		}
	});

	expect(result.Items!.length).toBe(10);
});
