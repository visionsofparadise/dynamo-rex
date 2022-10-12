import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { getFn, GetItemInput } from './get';
import { hasPutAttributes } from './hasAttributes';
import { PutReturnValues } from './put';
import { IdxATL, IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type DeleteItemInput<
	A extends DocumentClient.AttributeMap,
	Key extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues = never
> = Assign<
	NoTN<DocumentClient.DeleteItemInput>,
	{
		Key: GetItemInput<A, Key>['Key'];
		ReturnValues?: RV;
	}
>;

export type DeleteItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues = never> = Assign<
	DocumentClient.DeleteItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A : undefined;
	}
>;

export const deleteFn =
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
		query: DeleteItemInput<A, IdxKey<TIdxCfgM[TPIdxN]>, RV>
	): Promise<DeleteItemOutput<AIdxA, RV>> => {
		await getFn<TPIdxN, TIdxA, TIdxATL, TIdxCfgM>(config)<A, Idx>(query);

		const data = await config.client.delete({ TableName: config.name, ...query }).promise();

		hasPutAttributes<AIdxA, RV>(data, query.ReturnValues);

		return data;
	};
