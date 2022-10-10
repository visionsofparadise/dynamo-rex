import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import wait from 'wait';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('queries items with startsWith on primary key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	await wait(1000);

	const result = await TestItem.get.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});

it('queries items with startsWith on index key', async () => {
	for (let i = 195; i < 205; i++) {
		await new TestItem({ testString: String(i), testNumber: randomNumber() }).create();
	}

	await wait(1000);

	const result = await TestItem.get.gsi0.query().startsWith({ StartsWith: 'test-1' });

	expect(result.Items.length).toBe(5);
});
