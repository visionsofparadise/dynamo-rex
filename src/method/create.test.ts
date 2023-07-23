import { dxCreate } from './create';
import { dxTableReset } from './reset';
import { TestItem1KeySpace } from '../KeySpaceTest.dev';
import { randomNumber, randomString } from '../util/utils';
import { TestTable1 } from '../TableTest.dev';

beforeEach(() => dxTableReset(TestTable1));

it('creates new item', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	const result = await dxCreate(TestItem1KeySpace, item);

	expect(result).toBeUndefined();
});

it('throws if item exists', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxCreate(TestItem1KeySpace, item);

	await dxCreate(TestItem1KeySpace, item).catch(error => expect(error).toBeDefined());
});

it('creates new item with different sort key', async () => {
	const item = {
		testString: randomString(),
		testNumber: randomNumber()
	};

	await dxCreate(TestItem1KeySpace, item);

	const item2 = {
		testString: randomString(),
		testNumber: item.testNumber
	};

	const result = await dxCreate(TestItem1KeySpace, item2);

	expect(result).toBeUndefined();
});
