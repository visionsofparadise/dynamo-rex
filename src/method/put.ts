import { AnyKeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkPutCommand, DkPutCommandInput, DkPutReturnValues } from '../command/Put';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface PutItemInput<RV extends DkPutReturnValues = undefined>
	extends Omit<DkPutCommandInput<any, RV>, 'tableName' | 'item'> {}

export type PutItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DkPutReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const putTableItem = async <T extends Table = Table, RV extends DkPutReturnValues = undefined>(
	Table: T,
	item: T['Attributes'],
	input?: PutItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<PutItemsOutput<T['Attributes'], RV>> => {
	const output = await dkClient.send(
		new DkPutCommand<T['Attributes'], RV>({
			...input,
			tableName: Table.tableName,
			item
		})
	);

	return output.attributes;
};

export const putItem = async <K extends AnyKeySpace = AnyKeySpace, RV extends DkPutReturnValues = undefined>(
	KeySpace: K,
	item: K['Attributes'],
	input?: PutItemInput<RV>
): Promise<PutItemsOutput<K['Attributes'], RV>> => {
	const attributes = await putTableItem(KeySpace.Table, KeySpace.withIndexKeys(item), input, KeySpace.dkClient);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
