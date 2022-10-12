import { A } from 'ts-toolbelt';
import { TestTable } from '../TestTable.dev';

export const indexCheck: A.Equals<
	typeof TestTable['Index'],
	'primary' | 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const primaryIndexCheck: A.Equals<typeof TestTable['PrimaryIndex'], 'primary'> = 1;

export const primaryIndexKeyAttribtuesCheck: A.Equals<keyof typeof TestTable['PrimaryIndexKey'], 'pk' | 'sk'> = 1;

export const primaryIndexKeyValuesCheck: A.Equals<
	typeof TestTable['PrimaryIndexKey'][keyof typeof TestTable['PrimaryIndexKey']],
	string
> = 1;

export const indexKeySingleAttribtuesCheck: A.Equals<keyof typeof TestTable['IndexKeyM']['gsi5'], 'gsi5Pk'> = 1;

export const indexKeyValueCheck: A.Equals<
	typeof TestTable['IndexKeyM']['gsi5'][keyof typeof TestTable['IndexKeyM']['gsi5']],
	number
> = 1;

it('creates Table', async () => {
	expect(TestTable).toBeDefined();
});
