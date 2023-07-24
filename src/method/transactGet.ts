import { AnyKeySpace } from '../KeySpace';
import { DxTransactGetCommand, DxTransactGetCommandInput } from '../command/TransactGet';
import { GenericAttributes } from '../Dx';
import { PrimaryIndex, Table } from '../Table';

export interface DxTransactGetInput extends Omit<DxTransactGetCommandInput, 'requests'> {}

export type DxTransactGetOutput<Attributes extends GenericAttributes = GenericAttributes> = Array<Attributes>;

export const dxTableTransactGet = async <T extends Table = Table>(
	Table: T,
	keys: Array<T['IndexKeyMap'][PrimaryIndex]>,
	input?: DxTransactGetInput
): Promise<DxTransactGetOutput<T>> => {
	const output = await Table.dxClient.send(
		new DxTransactGetCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			requests: keys.map(key => ({ tableName: Table.tableName, key }))
		})
	);

	return output.items;
};

export const dxTransactGet = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	keyParams: Array<Parameters<K['keyOf']>[0]>,
	input?: DxTransactGetInput
): Promise<DxTransactGetOutput<K['Attributes']>> => {
	const items = await dxTableTransactGet(
		KeySpace.Table,
		keyParams.map(kp => KeySpace.keyOf(kp as any), input)
	);

	return items.map(item => KeySpace.omitIndexKeys(item));
};
