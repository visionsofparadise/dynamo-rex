import { PrimaryIndex, Table } from './Table';
import { ManyGsiTable, NoGsiTable } from './TableTest.dev';
import { A, U } from 'ts-toolbelt';

export const primaryIndexKeyCheck: A.Equals<
	(typeof ManyGsiTable)['IndexKeyMap'][PrimaryIndex],
	{ pk: string } & { sk: string }
> = 1;

export const secondaryIndexCheck: A.Equals<
	(typeof ManyGsiTable)['SecondaryIndex'],
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const secondaryIndexKeyCheck: A.Equals<
	U.IntersectOf<(typeof ManyGsiTable)['IndexKeyMap'][(typeof ManyGsiTable)['SecondaryIndex']]>,
	{
		gsi0Pk: string;
	} & {
		gsi0Sk: string;
	} & {
		gsi1Pk: number;
	} & {
		gsi1Sk: number | undefined;
	} & {
		gsi2Pk: string;
	} & {
		gsi2Sk: number;
	} & {
		gsi3Pk: number;
	} & {
		gsi3Sk: string | undefined;
	} & {
		gsi4Pk: string;
	} & {
		gsi5Pk: number;
	}
> = 1;

export const primaryIndexKeyCheck2: A.Equals<
	(typeof NoGsiTable)['IndexKeyMap'][PrimaryIndex],
	{ pk: string } & { sk: string }
> = 1;

export const secondaryIndexCheck2: A.Equals<(typeof NoGsiTable)['SecondaryIndex'], never> = 1;

export const neverSecondaryIndexCheck2: A.Equals<Table.GetIndexKey<typeof NoGsiTable, never>, never> = 1;

export const secondaryIndexKeyCheck2: A.Equals<
	Table.GetIndexKey<typeof NoGsiTable, (typeof NoGsiTable)['Index']>,
	{ pk: string } & { sk: string }
> = 1;

export const AttributesAndIndexKeysCheck2: A.Equals<
	(typeof NoGsiTable)['Attributes'],
	{ pk: string } & { sk: string } & Partial<{}>
> = 1;

it('type checks are valid', () => {
	expect(true).toBe(true);
});
