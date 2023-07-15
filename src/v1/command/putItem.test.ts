import { dxPutItem } from './putItem';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { nanoid } from 'nanoid';
import { randomNumber } from '../util/utils';
import { GetKeySpaceAttributes } from '../KeySpace';
import { dxReset } from './reset';
import { TestTable } from '../TableTest.dev';

beforeEach(() => dxReset(TestTable));

it('puts new item', async () => {
	const item = {
		testString: nanoid(),
		testNumber: randomNumber()
	};

	const result = await dxPutItem(TestItem1KeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('puts over existing item', async () => {
	const item = {
		testString: nanoid(),
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
		testString: nanoid(),
		testNumber: randomNumber()
	};

	await dxPutItem(TestItem1KeySpace, item);

	const updatedItem = {
		...item,
		optionalString: nanoid()
	};

	const result = await dxPutItem(TestItem1KeySpace, updatedItem, {
		returnValues: 'allOld'
	});

	const resultTypeCheck: A.Equals<typeof result, GetKeySpaceAttributes<typeof TestItem1KeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});
