import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import wait from 'wait';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('queries items with hashKey on primary key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	await wait(1000);

	const result = await TestItem.get.query().hashKeyOnly();

	expect(result.Items.length).toBe(3);
});

it('queries items with hashKey on index key', async () => {
	for (let i = 0; i < 3; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	await wait(1000);

	const result = await TestItem.get.gsi0.query().hashKeyOnly();

	expect(result.Items.length).toBe(3);
});
