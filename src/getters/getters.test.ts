import { TestTable } from '../TestTable.dev';
import { TestItem } from './gettersTestItem.dev';
import { A } from 'ts-toolbelt';

jest.useRealTimers();

beforeEach(TestTable.reset);

const result2 = TestItem.get.gsi1.query().hashKeyOnly;

export const gsi1QueryItemsCheck: A.Equals<
	keyof Awaited<ReturnType<typeof result2>>['Items'][number],
	| 'pk'
	| 'sk'
	| 'gsi0Pk'
	| 'gsi1Pk'
	| 'gsi2Pk'
	| 'gsi3Pk'
	| 'gsi4Pk'
	| 'gsi5Pk'
	| 'gsi0Sk'
	| 'gsi1Sk'
	| 'gsi2Sk'
	| 'gsi3Sk'
> = 1;

const result3 = TestItem.get.gsi2.query({ testString: '1' }).hashKeyOnly;

export const gsi2QueryItemsCheck: A.Equals<
	keyof Awaited<ReturnType<typeof result3>>['Items'][number],
	| 'pk'
	| 'sk'
	| 'gsi0Pk'
	| 'gsi1Pk'
	| 'gsi2Pk'
	| 'gsi3Pk'
	| 'gsi4Pk'
	| 'gsi5Pk'
	| 'gsi0Sk'
	| 'gsi1Sk'
	| 'gsi2Sk'
	| 'gsi3Sk'
	| 'testString'
> = 1;

it('adds getters correctly', () => {
	expect(TestItem.get).toBeDefined();
	expect(TestItem.get.call).toBeDefined();
	expect(TestItem.get.all).toBeDefined();
	expect(TestItem.get.one).toBeDefined();
	expect(TestItem.get.query).toBeDefined();
	expect(TestItem.get.query().hashKeyOnly).toBeDefined();
	expect(TestItem.get.query().startsWith).toBeDefined();
	expect(TestItem.get.query().between).toBeDefined();
	expect(TestItem.get.gsi0).toBeDefined();
	expect(TestItem.get.gsi1).toBeDefined();
	expect(TestItem.get.gsi2).toBeDefined();
	expect(TestItem.get.gsi3).toBeDefined();
	expect(TestItem.get.gsi4).toBeDefined();
	expect(TestItem.get.gsi5).toBeDefined();
});
