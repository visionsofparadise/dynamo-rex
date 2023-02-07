import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemInput } from './get';
import { putFn, PutItemInput, PutReturnValues } from './put';
import { IdxCfgM, IdxKey, MCfg, NotPIdxN, PIdxCfg, TIdxN } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	Key extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = PutItemInput<A, RV, ISIdxN, TPIdxN, TIdxCfgM> & GetItemInput<Key>;

export const createFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>, TPIdxCfg extends PIdxCfg>(
		config: MCfg,
		primaryIndexConfig: TPIdxCfg
	) =>
	async <A extends {}, RV extends PutReturnValues = never, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: CreateItemInput<A, IdxKey<TIdxCfgM[TPIdxN]>, RV, ISIdxN, TPIdxN, TIdxCfgM>
	) => {
		return putFn<TPIdxN, TIdxCfgM>(config)<A, RV, ISIdxN>({
			...query,
			ConditionExpression: `attribute_not_exists(${String(primaryIndexConfig.hashKey.attribute)})${
				query.ConditionExpression ? ` ${query.ConditionExpression}` : ''
			}`
		});
	};
