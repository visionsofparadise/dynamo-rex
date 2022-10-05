import { nanoid } from 'nanoid';
import { TestTable } from '../utils';

beforeEach(TestTable.reset);

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

		await TestTable.put({
			Item
		});
	}

	const beforeReset = await TestTable.scan();

	expect(beforeReset.Items!.length).toBe(10);

	await TestTable.reset();

	const result = await TestTable.scan();

	expect(result.Items!.length).toBe(0);
});
