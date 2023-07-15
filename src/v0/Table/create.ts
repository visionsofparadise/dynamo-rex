import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { putFn, PutItemInput, PutReturnValues } from './put';
import { IdxCfgM, MCfg, NotPIdxN, PIdxCfg, TIdxN } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = PutItemInput<A, RV, ISIdxN, TPIdxN, TIdxCfgM>;

export const createFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>, TPIdxCfg extends PIdxCfg>(
		config: MCfg,
		primaryIndexConfig: TPIdxCfg
	) =>
	async <A extends {}, RV extends PutReturnValues = never, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: CreateItemInput<A, RV, ISIdxN, TPIdxN, TIdxCfgM>
	) => {
		return putFn<TPIdxN, TIdxCfgM>(config)<A, RV, ISIdxN>({
			...query,
			ConditionExpression: `attribute_not_exists(${String(primaryIndexConfig.hashKey.attribute)})${
				query.ConditionExpression ? ` ${query.ConditionExpression}` : ''
			}`
		});
	};
