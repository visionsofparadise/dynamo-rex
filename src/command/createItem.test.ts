import { dxCreateItem } from './createItem';
import { dxReset } from './reset';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { randomNumber, randomString } from '../util/utils';
import { TestTable1 } from '../TableTest.dev';

beforeEach(() => dxReset(TestTable1));

it('creates new item', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	const result = await dxCreateItem(TestItem1KeySpace, item);

	expect(result).toBeUndefined();
});

it('throws if item exists', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxCreateItem(TestItem1KeySpace, item);

	await dxCreateItem(TestItem1KeySpace, item).catch(error => expect(error).toBeDefined());
});

it('creates new item with different sort key', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxCreateItem(TestItem1KeySpace, item);

	const item2 = {
		testString: randomString(),
		testNumber: item.testNumber
	};

	const result = await dxCreateItem(TestItem1KeySpace, item2);

	expect(result).toBeUndefined();
});
