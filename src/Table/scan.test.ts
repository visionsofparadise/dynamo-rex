import { nanoid } from 'nanoid';
import { TestTable } from '../utils';

afterEach(TestTable.reset, 10 * 1000);

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

		await TestTable.put({
			Item
		});
	}

	const result = await TestTable.scan();

	expect(result.Items!.length).toBe(10);
});

it('scan on index returns list of items', async () => {
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

	const result = await TestTable.scan({
		IndexName: 'gsi1'
	});

	expect(result.Items!.length).toBe(10);
});
