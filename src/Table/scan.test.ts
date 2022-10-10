import { nanoid } from 'nanoid';
import wait from 'wait';
import { TestTable } from '../TestTable.dev';

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
			gsi0Pk: 'test',
			gsi0Sk: nanoid()
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
		IndexName: 'gsi0'
	});

	expect(result.Items!.length).toBe(10);
});
