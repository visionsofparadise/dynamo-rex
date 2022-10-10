import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { getFn, GetItemInput } from './get';
import { hasPutAttributes } from './hasAttributes';
import { PutReturnValues } from './put';
import { MCfg } from './Table';

export type DeleteItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues
> = Assign<
	NoTN<DocumentClient.DeleteItemInput>,
	{
		Key: GetItemInput<A, PK>['Key'];
		ReturnValues?: RV;
	}
>;

export type DeleteItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Assign<
	DocumentClient.DeleteItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A : undefined;
	}
>;

export const deleteFn =
	<PKey extends object>(config: MCfg) =>
	async <A extends PKey, RV extends PutReturnValues>(
		query: DeleteItemInput<A, PKey, RV>
	): Promise<DeleteItemOutput<A, RV>> => {
		await getFn<PKey>(config)<A>(query);

		const data = await config.client.delete({ TableName: config.name, ...query }).promise();

		hasPutAttributes<A, RV>(data, query.ReturnValues);

		return data;
	};
