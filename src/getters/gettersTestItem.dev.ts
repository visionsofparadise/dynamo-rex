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
	static sk(props: Pick<ITestItem, 'testString'>) {
		return `test-${props.testString}`;
	}
	static gsi0Pk() {
		return 'test';
	}
	static gsi0Sk(props: Pick<ITestItem, 'testString'>) {
		return `test-${props.testString}`;
	}
	static gsi1Pk() {
		return randomNumber();
	}
	static gsi1Sk() {
		return undefined;
	}
	static gsi2Pk(props: Pick<ITestItem, 'testString'>) {
		return props.testString;
	}
	static gsi2Sk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}
	static gsi3Pk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}
	static gsi3Sk() {
		return undefined;
	}
	static gsi4Pk(props: Pick<ITestItem, 'testString'>) {
		return props.testString;
	}
	static gsi5Pk(props: Pick<ITestItem, 'testNumber'>) {
		return props.testNumber;
	}

	static get = TestTable.getters(TestItem);

	constructor(props: ITestItem) {
		super(props, TestItem);
	}
}
