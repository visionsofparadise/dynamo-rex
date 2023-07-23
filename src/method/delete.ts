import { AnyKeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../Dx';
import { DxDeleteCommand, DxDeleteCommandInput, DxDeleteReturnValues } from '../command/Delete';
import { Table } from '../Table';

export interface DxDeleteInput<RV extends DxDeleteReturnValues = undefined>
	extends Omit<DxDeleteCommandInput<any, RV>, 'tableName' | 'key'> {}

export type DxDeleteOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DxDeleteReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const dxTableDelete = async <T extends Table = Table, RV extends DxDeleteReturnValues = undefined>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	input?: DxDeleteInput<RV>
): Promise<DxDeleteOutput<T['AttributesAndIndexKeys'], RV>> => {
	const output = await Table.dxClient.send(
		new DxDeleteCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']], RV>({
			...input,
			tableName: Table.tableName,
			key
		})
	);

	return output.attributes;
};

export const dxDelete = async <K extends AnyKeySpace = AnyKeySpace, RV extends DxDeleteReturnValues = undefined>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: DxDeleteInput<RV>
): Promise<DxDeleteOutput<K['Attributes'], RV>> => {
	const attributes = await dxTableDelete(KeySpace.Table, KeySpace.keyOf(keyParams as any), input);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
