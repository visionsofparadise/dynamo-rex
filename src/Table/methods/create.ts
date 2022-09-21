import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';
import { get, GetItemInput } from './get';
import { put, PutItemOutput, PutReturnValues } from './put';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues
> = Omit<DocumentClient.PutItemInput, 'TableName' | 'Item' | 'ReturnValues'> & {
	Key: GetItemInput<A, PK>['Key'];
	Item: A;
	ReturnValues?: RV;
};

export const create =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap, RV extends PutReturnValues>(
		query: CreateItemInput<A, IdxCfg[TPIdxN]['key'], RV>
	): Promise<PutItemOutput<A, RV>> => {
		try {
			await get(Table)<A>(query);
		} catch (error) {
			return put(Table)<A, RV>(query);
		}

		throw new Error('Item already exists');
	};
