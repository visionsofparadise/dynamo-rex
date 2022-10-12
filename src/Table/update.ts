import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTN } from '../utils';
import { hasUpdateAttributes } from './hasAttributes';
import { PutReturnValues } from './put';
import { IdxATL, IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type UpdateReturnValues = 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' | PutReturnValues;

export type UpdateItemInput<Key extends DocumentClient.UpdateItemInput['Key'], RV extends UpdateReturnValues> = Assign<
	NoTN<DocumentClient.UpdateItemInput>,
	{ Key: Key; ReturnValues?: RV }
>;

export type UpdateItemOutput<A extends DocumentClient.AttributeMap, RV extends UpdateReturnValues> = Assign<
	DocumentClient.UpdateItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' ? A : undefined;
	}
>;

export const updateFn =
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
		query: UpdateItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>
	): Promise<UpdateItemOutput<AIdxA, RV>> => {
		const data = await config.client.update({ TableName: config.name, ...query }).promise();

		hasUpdateAttributes<AIdxA, RV>(data);

		if (config.logger) config.logger.info(data);

		return data;
	};
