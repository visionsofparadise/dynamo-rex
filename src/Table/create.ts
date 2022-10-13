import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { getFn, GetItemInput } from './get';
import { putFn, PutItemInput, PutReturnValues } from './put';
import { IdxCfgM, IdxKey, MCfg, NotPIdxN, TIdxN } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	Key extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = PutItemInput<A, RV, ISIdxN, TPIdxN, TIdxCfgM> & GetItemInput<Key>;

export const createFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async <A extends {}, RV extends PutReturnValues = never, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: CreateItemInput<A, IdxKey<TIdxCfgM[TPIdxN]>, RV, ISIdxN, TPIdxN, TIdxCfgM>
	) => {
		try {
			await getFn<TPIdxN, TIdxCfgM>(config)<A, ISIdxN>(query);
		} catch (error) {
			return putFn<TPIdxN, TIdxCfgM>(config)<A, RV, ISIdxN>(query);
		}

		throw new Error('Item already exists');
	};
