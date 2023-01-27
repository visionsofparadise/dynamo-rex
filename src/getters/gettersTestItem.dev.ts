import { TestTable } from '../TestTable.dev';
import { randomNumber } from '../utils';

export interface ITestItem {
	testString: string;
	testNumber: number;
}

export class TestItem extends TestTable.Item<ITestItem, 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'> {
	static secondaryIndexes = [
		'gsi0' as const,
		'gsi1' as const,
		'gsi2' as const,
		'gsi3' as const,
		'gsi4' as const,
		'gsi5' as const
	];

	static pk() {
		return 'test';
	}
	static sk(data: Pick<ITestItem, 'testString'>) {
		return `test-${data.testString}`;
	}
	static gsi0Pk() {
		return 'test';
	}
	static gsi0Sk(data: Pick<ITestItem, 'testString'>) {
		return `test-${data.testString}`;
	}
	static gsi1Pk() {
		return randomNumber();
	}
	static gsi1Sk() {
		return undefined;
	}
	static gsi2Pk(data: Pick<ITestItem, 'testString'>) {
		return data.testString;
	}
	static gsi2Sk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi3Pk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}
	static gsi3Sk() {
		return undefined;
	}
	static gsi4Pk(data: Pick<ITestItem, 'testString'>) {
		return data.testString;
	}
	static gsi5Pk(data: Pick<ITestItem, 'testNumber'>) {
		return data.testNumber;
	}

	static get = TestTable.getters(TestItem);

	constructor(data: ITestItem) {
		super(data, TestItem);
	}
}
