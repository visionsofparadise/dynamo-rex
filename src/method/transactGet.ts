import { AnyKeySpace } from '../KeySpace';
import { DkTransactGetCommand, DkTransactGetCommandInput } from '../command/TransactGet';
import { GenericAttributes } from '../util/utils';
import { PrimaryIndex, Table } from '../Table';
import { DkClient } from '../Client';

export interface TransactGetItemsInput extends Omit<DkTransactGetCommandInput, 'requests'> {}

export type TransactGetItemsOutput<Attributes extends GenericAttributes = GenericAttributes> = Array<Attributes>;

export const transactGetTableItems = async <T extends Table = Table>(
	Table: T,
	keys: Array<T['IndexKeyMap'][PrimaryIndex]>,
	input?: TransactGetItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<TransactGetItemsOutput<T>> => {
	const output = await dkClient.send(
		new DkTransactGetCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			requests: keys.map(key => ({ tableName: Table.tableName, key }))
		})
	);

	return output.items;
};

export const transactGetItems = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	keyParams: Array<Parameters<K['keyOf']>[0]>,
	input?: TransactGetItemsInput
): Promise<TransactGetItemsOutput<K['Attributes']>> => {
	const items = await transactGetTableItems(
		KeySpace.Table,
		keyParams.map(kp => KeySpace.keyOf(kp as any), input),
		input,
		KeySpace.dkClient
	);

	return items.map(item => KeySpace.omitIndexKeys(item));
};
