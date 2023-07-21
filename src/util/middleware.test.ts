import { Dx } from '../TableTest.dev';
import dayjs from 'dayjs';
import { randomNumber, randomString } from './utils';
import { dxCreate } from '../command/create';
import { dxGet } from '../command/get';
import { dxUpdateQuick } from '../command/updateQuick';
import { dxSetAttributeOnWriteMiddleware } from './setAttributeOnWriteMiddleware';

interface IBaseItem {
	updatedAt?: number;
}

interface ITestItem extends IBaseItem {
	testString: string;
	testNumber: number;
	updateableString: string;
}

it('implements updatedAt attribute with middleware', async () => {
	jest.useRealTimers();

	const TestTable = new Dx.Table<IBaseItem>().configure(
		{
			name: process.env.DYNAMODB_TABLE || 'test',
			indexes: {
				primaryIndex: {
					hash: {
						key: 'pk',
						value: 'string'
					},
					sort: {
						key: 'sk',
						value: 'string'
					}
				}
			}
		},
		dxSetAttributeOnWriteMiddleware('updatedAt', () => dayjs().valueOf())
	);

	const TestKeySpace = new TestTable.KeySpace<ITestItem>().configure({
		indexValueHandlers: {
			primaryIndex: {
				pk: (params: Pick<ITestItem, 'testNumber'>) => `test-${params.testNumber}`,
				sk: (params: Pick<ITestItem, 'testString'>) => `test-${params.testString}`
			}
		}
	});

	const testItem: ITestItem = {
		testNumber: randomNumber(),
		testString: randomString(),
		updateableString: randomString()
	};

	await dxCreate(TestKeySpace, testItem);

	const getItem = await dxGet(TestKeySpace, testItem);

	expect(getItem.updatedAt).toBeDefined();

	await dxUpdateQuick(TestKeySpace, testItem, {
		updateableString: randomString()
	});

	const getItem2 = await dxGet(TestKeySpace, testItem);

	expect(getItem2.updatedAt! > getItem.updatedAt!).toBe(true);
});
