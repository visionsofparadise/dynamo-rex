import { nanoid } from 'nanoid';
import { TestTable, wait } from '../utils';

beforeEach(TestTable.reset);

it('scan returns list of items', async () => {
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

	const result = await TestTable.scan();

	expect(result.Items!.length).toBe(10);
});

it('scan on index returns list of items', async () => {
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

	const result = await TestTable.scan({
		IndexName: 'gsi1'
	});

	expect(result.Items!.length).toBe(10);
});
