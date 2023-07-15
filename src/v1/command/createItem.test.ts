import { dxCreateItem } from './createItem';
import { dxReset } from './reset';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { nanoid } from 'nanoid';
import { randomNumber } from '../util/utils';
import { TestTable } from '../TableTest.dev';

beforeEach(() => dxReset(TestTable));

it('creates new item', async () => {
	const item = {
		testString: nanoid(),
		testNumber: randomNumber()
	};

	const result = await dxCreateItem(TestItem1KeySpace, item);

	expect(result).toBeUndefined();
});

it('throws if item exists', async () => {
	const item = {
		testString: nanoid(),
		testNumber: randomNumber()
	};

	await dxCreateItem(TestItem1KeySpace, item);

	await dxCreateItem(TestItem1KeySpace, item).catch(error => expect(error).toBeDefined());
});

it('creates new item with different sort key', async () => {
	const item = {
		testString: nanoid(),
		testNumber: randomNumber()
	};

	await dxCreateItem(TestItem1KeySpace, item);

	const item2 = {
		testString: nanoid(),
		testNumber: item.testNumber
	};

	const result = await dxCreateItem(TestItem1KeySpace, item2);

	expect(result).toBeUndefined();
});
