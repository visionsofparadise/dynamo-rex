import { nanoid } from 'nanoid';
import { randomNumber } from '../utils';
import { TestTable } from '../TestTable.dev';
import { TestItem } from './gettersTestItem.dev';

jest.useRealTimers();

beforeEach(TestTable.reset);

it('gets one item on primary key', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const result = await TestItem.get(testItem.props);

	expect(result.props.testString).toBe(testItem.props.testString);
});

it('gets one item on index key', async () => {
	const testItem = await new TestItem({ testString: nanoid(), testNumber: randomNumber() }).create();

	const result = await TestItem.get.gsi0.one(testItem.props);

	expect(result.props.testString).toBe(testItem.props.testString);
});
