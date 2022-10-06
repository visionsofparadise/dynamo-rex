import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTableName } from '../utils';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Assign<
	NoTableName<DocumentClient.PutItemInput>,
	{
		Item: A;
		ReturnValues?: RV;
	}
>;

export type PutItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Assign<
	DocumentClient.PutItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A : undefined;
	}
>;

export const putFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends PutReturnValues>(
		query: PutItemInput<A, RV>
	): Promise<PutItemOutput<A, RV>> => {
		const data = await ParentTable.config.client.put({ TableName: ParentTable.config.name, ...query }).promise();

		if (ParentTable.config.logger) ParentTable.config.logger.info(data);

		ParentTable.hasPutAttributes<A, RV>(data, query.ReturnValues);

		return data;
	};
