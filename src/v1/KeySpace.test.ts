import { A } from 'ts-toolbelt';
import { GetTableIndex, GetTableIndexKeys } from './Table';
import { GetKeySpaceAttributes, GetKeySpaceIndex, GetKeySpaceIndexValueParams } from './KeySpace';
import { ITestItem2, TestItem2KeySpace } from './KeySpaceTest.dev';

const testItem: GetKeySpaceAttributes<typeof TestItem2KeySpace> = {
	testString: 'test',
	testNumber: 1,
	deep: {
		deep: {
			deep: {
				testString: 'test'
			}
		}
	}
};
export const indexCheck: A.Equals<GetKeySpaceIndex<typeof TestItem2KeySpace>, 'primaryIndex' | 'gsi0'> = 1;

export const indexKeyCheck: A.Equals<
	GetTableIndexKeys<(typeof TestItem2KeySpace)['Table'], GetTableIndex<typeof TestItem2KeySpace.Table>>,
	Record<'pk', string> &
		Record<'sk', string> &
		Record<'gsi0Pk', string> &
		Record<'gsi0Sk', string> &
		Record<'gsi1Pk', number> &
		Record<'gsi1Sk', number | undefined> &
		Record<'gsi2Pk', string> &
		Record<'gsi2Sk', number> &
		Record<'gsi3Pk', number> &
		Record<'gsi3Sk', string | undefined> &
		Record<'gsi4Pk', string> &
		Record<'gsi5Pk', number>
> = 1;

export const indexKeyParamsCheck: A.Equals<
	GetKeySpaceIndexValueParams<typeof TestItem2KeySpace, 'gsi0'>,
	Pick<ITestItem2, 'testNumber'> & Pick<ITestItem2, 'testString'>
> = 1;

it('returns index key keys', () => {
	expect(TestItem2KeySpace.indexKeyKeys).toStrictEqual(['pk', 'sk', 'gsi0Pk', 'gsi0Sk']);
});

it('generates primary index key', () => {
	const primaryIndexKey = TestItem2KeySpace.keyOf(testItem);

	expect(primaryIndexKey.pk).toBe('test-1');
	expect(primaryIndexKey.sk).toBe('test-test');
	expect(Object.keys(primaryIndexKey).length).toBe(2);
});

it('generates secondary index key', () => {
	const secondaryIndexKey = TestItem2KeySpace.indexKeyOf('gsi0', testItem);

	expect(secondaryIndexKey.gsi0Pk).toBe('test-1');
	expect(secondaryIndexKey.gsi0Sk).toBe('test-test');
	expect(Object.keys(secondaryIndexKey).length).toBe(2);
});

it('generates index keys', () => {
	const indexKeys = TestItem2KeySpace.indexKeysOf(testItem);

	expect(indexKeys.pk).toBe('test-1');
	expect(indexKeys.sk).toBe('test-test');
	expect(indexKeys.gsi0Pk).toBe('test-1');
	expect(indexKeys.gsi0Sk).toBe('test-test');
	expect(Object.keys(indexKeys).length).toBe(4);
});
