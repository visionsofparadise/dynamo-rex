import { PrimaryIndex, Table } from './Table';
import { IBaseItem, TestTable1, TestTable2 } from './TableTest.dev';
import { A, O, U } from 'ts-toolbelt';

export const primaryIndexKeyCheck: A.Equals<
	(typeof TestTable1)['IndexKeyMap'][PrimaryIndex],
	{ pk: string; sk: string }
> = 1;

export const secondaryIndexCheck: A.Equals<
	(typeof TestTable1)['SecondaryIndex'],
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const secondaryIndexKeyCheck: A.Equals<
	U.IntersectOf<(typeof TestTable1)['IndexKeyMap'][(typeof TestTable1)['SecondaryIndex']]>,
	{
		gsi0Pk: string;
		gsi0Sk: string;
	} & {
		gsi1Pk: number;
		gsi1Sk: number | undefined;
	} & {
		gsi2Pk: string;
		gsi2Sk: number;
	} & {
		gsi3Pk: number;
		gsi3Sk: string | undefined;
	} & {
		gsi4Pk: string;
	} & {
		gsi5Pk: number;
	}
> = 1;

export const primaryIndexKeyCheck2: A.Equals<
	(typeof TestTable2)['IndexKeyMap'][PrimaryIndex],
	{ pk: string; sk: string }
> = 1;

export const secondaryIndexCheck2: A.Equals<(typeof TestTable2)['SecondaryIndex'], never> = 1;

export const neverSecondaryIndexCheck2: A.Equals<Table.GetIndexKey<typeof TestTable2, never>, never> = 1;

export const secondaryIndexKeyCheck2: A.Equals<
	Table.GetIndexKey<typeof TestTable2, (typeof TestTable2)['Index']>,
	{ pk: string; sk: string }
> = 1;

export const AttributesAndIndexKeysCheck2: A.Equals<
	(typeof TestTable2)['AttributesAndIndexKeys'],
	O.Merge<IBaseItem, { pk: string; sk: string }>
> = 1;

it('type checks are valid', () => {
	expect(true).toBe(true);
});
