import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkUpdateCommand, DkUpdateCommandInput } from '../command/Update';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface UpdateItemInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends Omit<DkUpdateCommandInput<any, RV>, 'tableName' | 'key'> {}

export type UpdateItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = ReturnValuesAttributes<Attributes, RV>;

export const updateTableItem = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	input: UpdateItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<UpdateItemOutput<T['Attributes'], RV>> => {
	const output = await dkClient.send(
		new DkUpdateCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']], RV>({
			...input,
			tableName: Table.tableName,
			key,
			returnValues: (input.returnValues || ReturnValue.ALL_NEW) as RV
		})
	);

	return output.attributes;
};

export const updateItem = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input: UpdateItemInput<RV>
): Promise<UpdateItemOutput<K['Attributes'], RV>> => {
	const attributes = await updateTableItem(KeySpace.Table, KeySpace.keyOf(keyParams as any), input, KeySpace.dkClient);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
