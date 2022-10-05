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
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends PutReturnValues>(
		query: PutItemInput<A, RV>
	): Promise<PutItemOutput<A, RV>> => {
		const data = await Table.config.client.put({ TableName: Table.config.name, ...query }).promise();

		Table.hasPutAttributes<A, RV>(data, query.ReturnValues);

		if (Table.config.logger) Table.config.logger.info(data);

		return data;
	};
