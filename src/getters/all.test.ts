import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import wait from 'wait';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('queries all items with hashKey on primary key', async () => {
	for (let i = 0; i < 20; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.all(TestItem.get.query).query(undefined, { Limit: 5 });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});

it('queries all items with beginsWith on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.all(TestItem.get.query).query(undefined, { Limit: 5, BeginsWith: 'test-1' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});

it('queries all items with between on primary key', async () => {
	for (let i = 180; i < 220; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get
		.all(TestItem.get.query)
		.query(undefined, { Limit: 5, Min: 'test-190', Max: 'test-209' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});

it('queries all items with hashKey on index key', async () => {
	for (let i = 0; i < 20; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.all(TestItem.get.gsi0.query).query(undefined, { Limit: 5 });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});

it('queries all items with beginsWith on index key', async () => {
	for (let i = 180; i < 220; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get.all(TestItem.get.gsi0.query).query(undefined, { Limit: 5, BeginsWith: 'test-1' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});

it('queries all items with between on index key', async () => {
	for (let i = 180; i < 220; i++) {
		const testItem = new TestItem({ testString: String(i), testNumber: randomNumber() });

		await testItem.create();
	}

	await wait(1000);

	const result = await TestItem.get
		.all(TestItem.get.gsi0.query)
		.query(undefined, { Limit: 5, Min: 'test-190', Max: 'test-209' });

	expect(result.Items.length).toBe(20);
	expect(result.PageData.length).toBeGreaterThanOrEqual(4);
});
