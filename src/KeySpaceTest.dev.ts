import { IBaseItem, TestTable1 } from './TableTest.dev';

export interface ITestItem1 extends IBaseItem {
	testString: string;
	testNumber: number;
	optionalString?: string;
}

export const TestItem1KeySpace = new TestTable1.KeySpace<ITestItem1, 'gsi0'>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: (params: Pick<ITestItem1, 'testNumber'>) => `test-${params.testNumber}`,
			sk: (params: Pick<ITestItem1, 'testString'>) => `test-${params.testString}`
		},
		gsi0: {
			gsi0Pk: (params: Pick<ITestItem1, 'testNumber'>) => `test-${params.testNumber}`,
			gsi0Sk: (params: Pick<ITestItem1, 'testString'>) => `test-${params.testString}`
		}
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

export const TestItem2KeySpace = new TestTable1.KeySpace<
	ITestItem2,
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`,
			sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
		},
		gsi0: {
			gsi0Pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`,
			gsi0Sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
		},
		gsi1: {
			gsi1Pk: (params: Pick<ITestItem2, 'testNumber'>) => params.testNumber,
			gsi1Sk: (params: Pick<ITestItem2, 'testNumber'>) => params.testNumber
		},
		gsi2: {
			gsi2Pk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`,
			gsi2Sk: (params: Pick<ITestItem2, 'testNumber'>) => params.testNumber
		},
		gsi3: {
			gsi3Pk: (params: Pick<ITestItem2, 'testNumber'>) => params.testNumber,
			gsi3Sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
		},
		gsi4: {
			gsi4Pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`
		},
		gsi5: {
			gsi5Pk: (params: Pick<ITestItem2, 'testNumber'>) => params.testNumber
		}
	}
});

export const TestItem3KeySpace = new TestTable1.KeySpace<ITestItem2>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: (params: Pick<ITestItem2, 'testNumber'>) => `test-${params.testNumber}`,
			sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
		}
	}
});

export const TestItem4KeySpace = new TestTable1.KeySpace<ITestItem2>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: () => `test`,
			sk: (params: Pick<ITestItem2, 'testString'>) => `test-${params.testString}`
		}
	}
});

export const TestItem5KeySpace = new TestTable1.KeySpace<ITestItem2>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: () => `test`,
			sk: () => `test`
		}
	}
});
