import { Table } from '../Table';
import { DxGetCommand, DxGetCommandInput } from '../command/Get';
import { GenericAttributes } from '../Dx';
import { AnyKeySpace } from '../KeySpace';

export interface DxGetInput extends Omit<DxGetCommandInput, 'tableName' | 'key'> {}

export type DxGetOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export const dxTableGet = async <T extends Table>(
	Table: T,
	keyParams: T['IndexKeyMap'][T['PrimaryIndex']],
	input?: DxGetInput
): Promise<DxGetOutput<T['AttributesAndIndexKeys']>> => {
	const output = await Table.dxClient.send(
		new DxGetCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			tableName: Table.tableName,
			key: keyParams
		})
	);

	return output.item;
};

export const dxGet = async <K extends AnyKeySpace>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: DxGetInput
): Promise<DxGetOutput<K['Attributes']>> => {
	const item = await dxTableGet(KeySpace.Table, KeySpace.keyOf(keyParams as any), input);

	return KeySpace.omitIndexKeys(item);
};
