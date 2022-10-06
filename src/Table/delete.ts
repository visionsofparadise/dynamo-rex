import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTableName } from '../utils';
import { GetItemInput } from './get';
import { PutReturnValues } from './put';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type DeleteItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues
> = Assign<
	NoTableName<DocumentClient.DeleteItemInput>,
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
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends PutReturnValues>(
		query: DeleteItemInput<A, IdxKey<TIdxCfg[TPIdxN]>, RV>
	): Promise<DeleteItemOutput<A, RV>> => {
		await ParentTable.get(query);

		const data = await ParentTable.config.client.delete({ TableName: ParentTable.config.name, ...query }).promise();

		ParentTable.hasPutAttributes<A, RV>(data, query.ReturnValues);

		return data;
	};
