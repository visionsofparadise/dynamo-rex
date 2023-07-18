import { TestTable1 } from '../TableTest.dev';
import { dxQuickUpdateItem } from './quickUpdateItem';
import { randomNumber, randomString } from '../util/utils';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem2KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { dxReset } from './reset';
import { dxOp } from '../UpdateOp';

beforeEach(() => dxReset(TestTable1));

it('updates an existing item', async () => {
	const testString = randomString();
	const testNumber = randomNumber();

	const item = {
		pk: `test-${testNumber}`,
		sk: `test-${testString}`,
		testString,
		testNumber,
		deep: {
			deep: {
				deep: {
					testString
				}
			}
		}
	};

	await TestTable1.client.send(
		new PutCommand({
			TableName: TestTable1.config.name,
			Item: item
		})
	);

	const itemWithoutKeys = { testString, testNumber };

	const updatedTestString = randomString();

	const result = await dxQuickUpdateItem(TestItem2KeySpace, itemWithoutKeys, {
		testNumber: dxOp.Add(1),
		deep: {
			deep: {
				deep: dxOp.Value({
					testString: updatedTestString
				})
			}
		}
	});

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	const { Item } = await TestTable1.client.send(
		new GetCommand({
			TableName: TestTable1.config.name,
			Key: TestItem2KeySpace.keyOf(itemWithoutKeys)
		})
	);

	expect(Item!.testNumber).toBe(item.testNumber + 1);
	expect(Item!.deep.deep.deep.testString).toBe(updatedTestString);
});
