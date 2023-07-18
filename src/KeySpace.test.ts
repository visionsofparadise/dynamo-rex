import { A } from 'ts-toolbelt';
import { ITestItem2, TestItem2KeySpace } from './KeySpaceTest.dev';

const testString = 'test';
const testNumber = 1;

const testItem: (typeof TestItem2KeySpace)['Attributes'] = {
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

type TestKeySpace2IndexKeys = {
	pk: string;
	sk: string;
	gsi0Pk: string;
	gsi0Sk: string;
	gsi1Pk: number;
	gsi1Sk: number | undefined;
	gsi2Pk: string;
	gsi2Sk: number;
	gsi3Pk: number;
	gsi3Sk: string | undefined;
	gsi4Pk: string;
	gsi5Pk: number;
};

it('returns indexes', () => {
	const check: A.Equals<
		(typeof TestItem2KeySpace)['indexes'],
		Array<'primaryIndex' | 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'>
	> = 1;

	expect(check).toBe(1);

	expect(TestItem2KeySpace.indexes).toStrictEqual(['primaryIndex', 'gsi0', 'gsi1', 'gsi2', 'gsi3', 'gsi4', 'gsi5']);
});

it('returns index key keys', () => {
	const check: A.Equals<
		(typeof TestItem2KeySpace)['attributeKeys'],
		Array<
			| 'pk'
			| 'sk'
			| 'gsi0Pk'
			| 'gsi0Sk'
			| 'gsi1Pk'
			| 'gsi1Sk'
			| 'gsi2Pk'
			| 'gsi2Sk'
			| 'gsi3Pk'
			| 'gsi3Sk'
			| 'gsi4Pk'
			| 'gsi5Pk'
		>
	> = 1;

	TestItem2KeySpace.indexAttributeKeys('gsi0');

	expect(check).toBe(1);

	expect(TestItem2KeySpace.attributeKeys).toStrictEqual([
		'pk',
		'sk',
		'gsi0Pk',
		'gsi0Sk',
		'gsi1Pk',
		'gsi1Sk',
		'gsi2Pk',
		'gsi2Sk',
		'gsi3Pk',
		'gsi3Sk',
		'gsi4Pk',
		'gsi5Pk'
	]);
});

it('generates primary index key', () => {
	const paramCheck: A.Equals<
		Parameters<(typeof TestItem2KeySpace)['keyOf']>[0],
		{
			testString: string;
			testNumber: number;
		}
	> = 1;

	expect(paramCheck).toBe(1);

	const primaryIndexKey = TestItem2KeySpace.keyOf({
		testString,
		testNumber
	});

	const check: A.Equals<typeof primaryIndexKey, { pk: string; sk: string }> = 1;

	expect(check).toBe(1);

	expect(primaryIndexKey.pk).toBe('test-1');
	expect(primaryIndexKey.sk).toBe('test-test');
	expect(Object.keys(primaryIndexKey).length).toBe(2);
});

it('generates secondary index key', () => {
	const secondaryIndexKey = TestItem2KeySpace.indexKeyOf('gsi0', {
		testNumber,
		testString
	});

	const check: A.Equals<typeof secondaryIndexKey, { gsi0Pk: string; gsi0Sk: string }> = 1;

	expect(check).toBe(1);

	expect(secondaryIndexKey.gsi0Pk).toBe('test-1');
	expect(secondaryIndexKey.gsi0Sk).toBe('test-test');
	expect(Object.keys(secondaryIndexKey).length).toBe(2);
});

it('generates index keys', () => {
	const indexKeys = TestItem2KeySpace.indexKeysOf({
		testNumber,
		testString
	});

	const check: A.Equals<typeof indexKeys, TestKeySpace2IndexKeys> = 1;

	expect(check).toBe(1);

	expect(indexKeys.pk).toBe('test-1');
	expect(indexKeys.sk).toBe('test-test');
	expect(indexKeys.gsi0Pk).toBe('test-1');
	expect(indexKeys.gsi0Sk).toBe('test-test');
	expect(Object.keys(indexKeys).length).toBe(12);
});

it('returns testItem with index keys', () => {
	const withIndexKeys = TestItem2KeySpace.withIndexKeys(testItem);

	const check: A.Equals<typeof withIndexKeys, ITestItem2 & TestKeySpace2IndexKeys> = 1;

	expect(check).toBe(1);

	expect(Object.keys(withIndexKeys).length).toBe(15);
});

it('omits index keys', () => {
	const testItem2 = {
		testString: 'test-string',
		pk: 'test-string'
	};

	const omitIndexKeys = TestItem2KeySpace.omitIndexKeys(testItem2);

	const check: A.Equals<typeof omitIndexKeys, { testString: string }> = 1;

	expect(check).toBe(1);

	expect(Object.keys(omitIndexKeys).length).toBe(1);
});
