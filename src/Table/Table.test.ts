import { A } from 'ts-toolbelt';
import { TestTable } from '../utils';

export const indexCheck: A.Equals<
	typeof TestTable['Index'],
	'primary' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5' | 'gsi6'
> = 1;

export const primaryIndexCheck: A.Equals<typeof TestTable['PrimaryIndex'], 'primary'> = 1;

export const primaryIndexKeyAttribtuesCheck: A.Equals<keyof typeof TestTable['PrimaryIndexKey'], 'pk' | 'sk'> = 1;

export const primaryIndexKeyValuesCheck: A.Equals<
	typeof TestTable['PrimaryIndexKey'][keyof typeof TestTable['PrimaryIndexKey']],
	string
> = 1;

export const indexKeySingleAttribtuesCheck: A.Equals<keyof typeof TestTable['IndexKeyMap']['gsi6'], 'gsi6Pk'> = 1;

export const indexKeyValueCheck: A.Equals<
	typeof TestTable['IndexKeyMap']['gsi6'][keyof typeof TestTable['IndexKeyMap']['gsi6']],
	number
> = 1;

it('creates Table', async () => {
	expect(TestTable).toBeDefined();
});
