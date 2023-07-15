import { PrimaryIndex, GetTableIndexKeys, GetTableSecondaryIndex, GetTableIndexKey } from './Table';
import { TestTable } from './TableTest.dev';
import { A } from 'ts-toolbelt';

export const primaryIndexKeyCheck: A.Equals<
	GetTableIndexKey<typeof TestTable, PrimaryIndex>,
	Record<'pk', string> & Record<'sk', string>
> = 1;

export const secondaryIndexCheck: A.Equals<
	GetTableSecondaryIndex<typeof TestTable>,
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const secondaryIndexKeyCheck: A.Equals<
	GetTableIndexKeys<typeof TestTable, GetTableSecondaryIndex<typeof TestTable>>,
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

it('type checks are valid', () => {
	expect(true).toBe(true);
});
