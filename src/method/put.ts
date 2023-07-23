import { AnyKeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../Dx';
import { DxPutCommand, DxPutCommandInput, DxPutReturnValues } from '../command/Put';
import { Table } from '../Table';

export interface DxPutInput<RV extends DxPutReturnValues = undefined>
	extends Omit<DxPutCommandInput<any, RV>, 'tableName' | 'item'> {}

export type DxPutOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DxPutReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const dxTablePut = async <T extends Table = Table, RV extends DxPutReturnValues = undefined>(
	Table: T,
	item: T['AttributesAndIndexKeys'],
	input?: DxPutInput<RV>
): Promise<DxPutOutput<T['AttributesAndIndexKeys'], RV>> => {
	const output = await Table.dxClient.send(
		new DxPutCommand<T['AttributesAndIndexKeys'], RV>({
			...input,
			tableName: Table.tableName,
			item
		})
	);

	return output.attributes;
};

export const dxPut = async <K extends AnyKeySpace = AnyKeySpace, RV extends DxPutReturnValues = undefined>(
	KeySpace: K,
	item: K['Attributes'],
	input?: DxPutInput<RV>
): Promise<DxPutOutput<K['Attributes'], RV>> => {
	const attributes = await dxTablePut(KeySpace.Table, KeySpace.withIndexKeys(item), input);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
