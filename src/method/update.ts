import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../Dx';
import { DxUpdateCommand, DxUpdateCommandInput } from '../command/Update';
import { Table } from '../Table';

export interface DxUpdateInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends Omit<DxUpdateCommandInput<any, RV>, 'tableName' | 'key'> {}

export type DxUpdateOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = ReturnValuesAttributes<Attributes, RV>;

export const dxTableUpdate = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	input: DxUpdateInput<RV>
): Promise<DxUpdateOutput<T['AttributesAndIndexKeys'], RV>> => {
	const output = await Table.dxClient.send(
		new DxUpdateCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']], RV>({
			...input,
			tableName: Table.tableName,
			key,
			returnValues: (input.returnValues || ReturnValue.ALL_NEW) as RV
		})
	);

	return output.attributes;
};

export const dxUpdate = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input: DxUpdateInput<RV>
): Promise<DxUpdateOutput<K['Attributes'], RV>> => {
	const attributes = await dxTableUpdate(KeySpace.Table, KeySpace.keyOf(keyParams as any), input);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
