import { Table } from '../Table';
import { DkGetCommand, DkGetCommandInput } from '../command/Get';
import { GenericAttributes } from '../util/utils';
import { AnyKeySpace } from '../KeySpace';
import { DkClient } from '../Client';

export interface GetItemInput extends Omit<DkGetCommandInput, 'tableName' | 'key'> {}

export type GetItemOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export const getTableItem = async <T extends Table>(
	Table: T,
	keyParams: T['IndexKeyMap'][T['PrimaryIndex']],
	input?: GetItemInput,
	dkClient: DkClient = Table.dkClient
): Promise<GetItemOutput<T['Attributes']>> => {
	const output = await dkClient.send(
		new DkGetCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			tableName: Table.tableName,
			key: keyParams
		})
	);

	return output.item;
};

export const getItem = async <K extends AnyKeySpace>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: GetItemInput
): Promise<GetItemOutput<K['Attributes']>> => {
	const item = await getTableItem(KeySpace.Table, KeySpace.keyOf(keyParams as any), input, KeySpace.dkClient);

	return KeySpace.omitIndexKeys(item);
};
