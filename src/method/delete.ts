import { AnyKeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkDeleteCommand, DkDeleteCommandInput, DkDeleteReturnValues } from '../command/Delete';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface DeleteItemInput<RV extends DkDeleteReturnValues = undefined>
	extends Omit<DkDeleteCommandInput<any, RV>, 'tableName' | 'key'> {}

export type DeleteItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DkDeleteReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const deleteTableItem = async <T extends Table = Table, RV extends DkDeleteReturnValues = undefined>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	input?: DeleteItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<DeleteItemOutput<T['Attributes'], RV>> => {
	const output = await dkClient.send(
		new DkDeleteCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']], RV>({
			...input,
			tableName: Table.tableName,
			key
		})
	);

	return output.attributes;
};

export const deleteItem = async <K extends AnyKeySpace = AnyKeySpace, RV extends DkDeleteReturnValues = undefined>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: DeleteItemInput<RV>
): Promise<DeleteItemOutput<K['Attributes'], RV>> => {
	const attributes = await deleteTableItem(KeySpace.Table, KeySpace.keyOf(keyParams as any), input, KeySpace.dkClient);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
