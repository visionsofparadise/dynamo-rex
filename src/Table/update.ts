import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTableName } from '../utils';
import { PutReturnValues } from './put';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type UpdateReturnValues = 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' | PutReturnValues;

export type UpdateItemInput<PK extends DocumentClient.UpdateItemInput['Key'], RV extends UpdateReturnValues> = Assign<
	NoTableName<DocumentClient.UpdateItemInput>,
	{ Key: PK; ReturnValues?: RV }
>;

export type UpdateItemOutput<A extends DocumentClient.AttributeMap, RV extends UpdateReturnValues> = Assign<
	DocumentClient.UpdateItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' ? A : undefined;
	}
>;

export const updateFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends UpdateReturnValues>(
		query: UpdateItemInput<IdxKey<TIdxCfg[TPIdxN]>, RV>
	): Promise<UpdateItemOutput<A, RV>> => {
		const data = await ParentTable.config.client.update({ TableName: ParentTable.config.name, ...query }).promise();

		ParentTable.hasUpdateAttributes<A, RV>(data);

		if (ParentTable.config.logger) ParentTable.config.logger.info(data);

		return data;
	};
