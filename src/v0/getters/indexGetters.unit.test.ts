import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import wait from 'wait';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 3; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.query();

	expect(result.Items.length).toBe(3);
});

it('queries items with hashKey on index key', async () => {
	for (let i = 0; i < 3; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.gsi0.query();

	expect(result.Items.length).toBe(3);
});

it('queries items with beginsWith on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.query(undefined, { BeginsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with beginsWith on index key', async () => {
	for (let i = 195; i < 205; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.gsi0.query(undefined, { BeginsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with between on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.query(undefined, { Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});

it('queries items with between on index key', async () => {
	for (let i = 195; i < 205; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.gsi0.query(undefined, { Min: 'test-198', Max: 'test-204' });

	expect(result.Items.length).toBe(7);
});
