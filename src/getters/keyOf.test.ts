import { nanoid } from 'nanoid';
import { randomNumber } from '../utils';
import { A } from 'ts-toolbelt';
import { TestTable } from '../TestTable.dev';
import { TestItem, ITestItem } from './gettersTestItem.dev';

export const primaryKeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['keyOf']>[0],
	Pick<ITestItem, 'testString'>
> = 1;

export const gsi1KeyParamsCheck: A.Equals<Parameters<typeof TestItem['get']['gsi1']['keyOf']>[0], void> = 1;

export const gsi2KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi2']['keyOf']>[0],
	Pick<ITestItem, 'testString'> & Pick<ITestItem, 'testNumber'>
> = 1;

export const gsi3KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi3']['keyOf']>[0],
	Pick<ITestItem, 'testNumber'>
> = 1;

export const gsi4KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi4']['keyOf']>[0],
	Pick<ITestItem, 'testString'>
> = 1;

export const gsi5KeyParamsCheck: A.Equals<
	Parameters<typeof TestItem['get']['gsi5']['keyOf']>[0],
	Pick<ITestItem, 'testNumber'>
> = 1;

jest.useRealTimers();

beforeEach(TestTable.reset);

it('gets primary key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = TestItem.get.keyOf(testItem.item);

	expect(key).toStrictEqual(testItem.key);
});

it('gets index key of item', () => {
	const testItem = new TestItem({ testString: nanoid(), testNumber: randomNumber() });

	const key = TestItem.get.gsi0.keyOf(testItem.item);

	expect(key).toStrictEqual(testItem.indexKey('gsi0'));
});
