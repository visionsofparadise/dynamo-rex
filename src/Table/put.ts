import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { assertPutAttributes } from './assertAttributes';
import { IdxCfgM, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	NoTN<DocumentClient.PutItemInput>,
	{
		Item: A & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>;
		ReturnValues?: RV;
	}
>;

export type PutItemOutput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	DocumentClient.PutItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM> : undefined;
	}
>;

export const putFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async <A extends {}, RV extends PutReturnValues = never, TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: PutItemInput<A, RV, TSIdxN, TPIdxN, TIdxCfgM>
	): Promise<PutItemOutput<A, RV, TSIdxN, TPIdxN, TIdxCfgM>> => {
		const data = await config.client.put({ TableName: config.name, ...query }).promise();

		if (config.logger) config.logger.info(data);

		assertPutAttributes<A, RV, TSIdxN, TPIdxN, TIdxCfgM>(data, query.ReturnValues);

		return data;
	};
