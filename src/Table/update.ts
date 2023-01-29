import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { convertObjectToUpdateExpression } from '../Item/convertObjectToUpdateExpression';
import { O } from 'ts-toolbelt';
import { Assign, NoTN } from '../utils';
import { assertUpdateAttributes } from './assertAttributes';
import { PutReturnValues } from './put';
import { IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type UpdateReturnValues = 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' | PutReturnValues;

export type UpdateItemInput<Key extends DocumentClient.UpdateItemInput['Key'], RV extends UpdateReturnValues> = Assign<
	NoTN<DocumentClient.UpdateItemInput>,
	{ Key: Key; ReturnValues?: RV }
>;

export type UpdateItemOutput<
	A extends DocumentClient.AttributeMap,
	RV extends UpdateReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	DocumentClient.UpdateItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW'
			? A & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>
			: undefined;
	}
>;

export const updateFn = <TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) => {
	const update = async <
		A extends {},
		RV extends UpdateReturnValues = never,
		TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never
	>(
		query: UpdateItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>
	): Promise<UpdateItemOutput<A, RV, TSIdxN, TPIdxN, TIdxCfgM>> => {
		const data = await config.client.update({ TableName: config.name, ...query }).promise();

		assertUpdateAttributes<A, RV, TSIdxN, TPIdxN, TIdxCfgM>(data, query.ReturnValues);

		if (config.logger) config.logger.info(data);

		return data;
	};

	const updateFromObject = async <
		A extends {},
		RV extends UpdateReturnValues = never,
		TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never
	>(
		query: Omit<
			UpdateItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>,
			'UpdateExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
		>,
		object: O.Partial<A, 'deep'>
	): Promise<UpdateItemOutput<A, RV, TSIdxN, TPIdxN, TIdxCfgM>> => {
		const updateExpression = convertObjectToUpdateExpression(object);

		const data = await config.client.update({ TableName: config.name, ...query, ...updateExpression }).promise();

		assertUpdateAttributes<A, RV, TSIdxN, TPIdxN, TIdxCfgM>(data, query.ReturnValues);

		if (config.logger) config.logger.info(data);

		return data;
	};

	return {
		update,
		updateFromObject
	};
};
