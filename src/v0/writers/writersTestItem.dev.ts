import { TestTable } from '../TestTable.dev';

export interface ITestItem {
	testString: string;
	testNumber: number;
}

export class TestItem extends TestTable.Item<ITestItem> {
	static secondaryIndexes = [];

	static pk() {
		return 'test';
	}
	static sk(data: Pick<ITestItem, 'testNumber'>) {
		return `test-${data.testNumber}`;
	}

	static write = TestTable.writers(TestItem);

	constructor(data: ITestItem) {
		super(data, TestItem);
	}
}
