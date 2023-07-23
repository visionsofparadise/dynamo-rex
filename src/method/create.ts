import { AnyKeySpace } from '../KeySpace';
import { Table } from '../Table';
import { DxPutInput, dxTablePut } from './put';

export interface DxCreateInput extends Omit<DxPutInput, 'returnValues'> {}

export type DxCreateOutput = void;

export const dxTableCreate = async <T extends Table = Table>(
	Table: T,
	item: T['AttributesAndIndexKeys'],
	input?: DxCreateInput
): Promise<DxCreateOutput> => {
	await dxTablePut(Table, item, {
		...input,
		conditionExpression: `attribute_not_exists(#hashKey)${
			input?.conditionExpression ? ` ${input?.conditionExpression}` : ''
		}`,
		expressionAttributeNames: {
			'#hashKey': Table.config.indexes.primaryIndex.hash.key,
			...input?.expressionAttributeNames
		}
	});

	return;
};

export const dxCreate = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	item: K['Attributes'],
	input?: DxCreateInput
): Promise<DxCreateOutput> => dxTableCreate(KeySpace.Table, KeySpace.withIndexKeys(item), input);
