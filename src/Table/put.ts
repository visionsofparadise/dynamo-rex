import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasPutAttributes } from './hasAttributes';
import { IdxATL, IdxCfgM, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues = never> = Assign<
	NoTN<DocumentClient.PutItemInput>,
	{
		Item: A;
		ReturnValues?: RV;
	}
>;

export type PutItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues = never> = Assign<
	DocumentClient.PutItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A : undefined;
	}
>;

export const putFn =
	<
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL>
	>(
		config: MCfg
	) =>
	async <
		A extends {},
		Idx extends NotPIdxN<TPIdxN, TIdxCfgM> | never = never,
		RV extends PutReturnValues = never,
		AIdxA extends DocumentClient.AttributeMap = A & IdxKeys<TPIdxN | Idx, TIdxCfgM>
	>(
		query: PutItemInput<AIdxA, RV>
	): Promise<PutItemOutput<AIdxA, RV>> => {
		const data = await config.client.put({ TableName: config.name, ...query }).promise();

		if (config.logger) config.logger.info(data);

		hasPutAttributes<AIdxA, RV>(data, query.ReturnValues);

		return data;
	};
