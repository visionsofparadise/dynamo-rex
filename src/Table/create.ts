import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemInput } from './get';
import { PutItemInput, PutItemOutput, PutReturnValues } from './put';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues
> = PutItemInput<A, RV> & GetItemInput<A, PK>;

export const createFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends PutReturnValues>(
		query: CreateItemInput<A, IdxKey<TIdxCfg[TPIdxN]>, RV>
	): Promise<PutItemOutput<A, RV>> => {
		try {
			await ParentTable.get<A>(query);
		} catch (error) {
			return ParentTable.put<A, RV>(query);
		}

		throw new Error('Item already exists');
	};
