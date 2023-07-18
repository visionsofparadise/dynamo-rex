import { dxPutItem } from './putItem';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { randomNumber, randomString } from '../util/utils';
import { dxReset } from './reset';
import { TestTable1 } from '../TableTest.dev';
import { ReturnValue } from '@aws-sdk/client-dynamodb';

beforeEach(() => dxReset(TestTable1));

it('puts new item', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	const result = await dxPutItem(TestItem1KeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('puts over existing item', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxPutItem(TestItem1KeySpace, item);

	const result = await dxPutItem(TestItem1KeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('returns old values', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxPutItem(TestItem1KeySpace, item);

	const updatedItem = {
		...item,
		optionalString: randomString()
	};

	const result = await dxPutItem(TestItem1KeySpace, updatedItem, {
		returnValues: ReturnValue.ALL_OLD
	});

	const resultTypeCheck: A.Equals<typeof result, (typeof TestItem1KeySpace)['Attributes']> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});
