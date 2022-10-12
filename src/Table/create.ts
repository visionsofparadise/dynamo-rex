import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { getFn, GetItemInput } from './get';
import { putFn, PutItemInput, PutReturnValues } from './put';
import { IdxATL, IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues = never,
	AIdxA extends DocumentClient.AttributeMap = A & PK
> = PutItemInput<AIdxA, RV> & GetItemInput<A, PK>;

export const createFn =
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
		query: CreateItemInput<A, IdxKey<TIdxCfgM[TPIdxN]>, RV, AIdxA>
	) => {
		try {
			await getFn<TPIdxN, TIdxA, TIdxATL, TIdxCfgM>(config)<A, Idx, AIdxA>(query);
		} catch (error) {
			return putFn<TPIdxN, TIdxA, TIdxATL, TIdxCfgM>(config)<A, Idx, RV, AIdxA>(query);
		}

		throw new Error('Item already exists');
	};
