import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { getFn, GetItemInput } from './get';
import { hasPutAttributes } from './hasAttributes';
import { PutReturnValues } from './put';
import { IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type DeleteItemInput<
	Key extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues = never
> = Assign<
	NoTN<DocumentClient.DeleteItemInput>,
	{
		Key: GetItemInput<Key>['Key'];
		ReturnValues?: RV;
	}
>;

export type DeleteItemOutput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	DocumentClient.DeleteItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM> : undefined;
	}
>;

export const deleteFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async <A extends {}, RV extends PutReturnValues = never, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: DeleteItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>
	): Promise<DeleteItemOutput<A, RV, ISIdxN, TPIdxN, TIdxCfgM>> => {
		await getFn<TPIdxN, TIdxCfgM>(config)<A, ISIdxN>(query);

		const data = await config.client.delete({ TableName: config.name, ...query }).promise();

		hasPutAttributes<A, RV, ISIdxN, TPIdxN, TIdxCfgM>(data, query.ReturnValues);

		return data;
	};
