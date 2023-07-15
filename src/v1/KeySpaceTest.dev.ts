import { IBaseItem, TestTable } from './TableTest.dev';

export interface ITestItem1 extends IBaseItem {
	testString: string;
	testNumber: number;
	optionalString?: string;
}

export const TestItem1KeySpace = new TestTable.KeySpace<ITestItem1>().configure({
	secondaryIndexes: ['gsi0'],
	indexValueHandlers: {
		pk: (params: Pick<ITestItem1, 'testNumber'>) => `test-${params.testNumber}`,
		sk: (params: Pick<ITestItem1, 'testString'>) => `test-${params.testString}`,
		gsi0Pk: (params: Pick<ITestItem1, 'testNumber'>) => `test-${params.testNumber}`,
		gsi0Sk: (params: Pick<ITestItem1, 'testString'>) => `test-${params.testString}`
	}
});

export interface ITestItem2 extends IBaseItem {
	testString: string;
	testNumber: number;
	deep: {
		deep: {
			deep: {
				testString: string;
			};
		};
	};
}

export const TestItem2KeySpace = new TestTable.KeySpace<ITestItem2>().configure({
	secondaryIndexes: ['gsi0'],
	indexValueHandlers: {
		pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`,
		sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`,
		gsi0Pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`,
		gsi0Sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
	}
});
