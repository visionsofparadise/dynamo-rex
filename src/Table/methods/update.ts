import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export type UpdateReturnValues = 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' | undefined | never;

export type UpdateItemInput<PK extends DocumentClient.UpdateItemInput['Key'], RV extends UpdateReturnValues> = Omit<
	DocumentClient.UpdateItemInput,
	'TableName' | 'Key' | 'ReturnValues'
> & { Key: PK; ReturnValues?: RV };

export type UpdateItemOutput<A extends DocumentClient.AttributeMap, RV extends UpdateReturnValues> = Omit<
	DocumentClient.UpdateItemOutput,
	'Attributes'
> & {
	Attributes: RV extends 'NONE' | undefined | never
		? undefined
		: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW'
		? A
		: undefined;
};

export const update =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap, RV extends UpdateReturnValues>(
		query: UpdateItemInput<IdxCfg[TPIdxN]['key'], RV>
	): Promise<UpdateItemOutput<A, RV>> => {
		const data = await Table.tableConfig.client.update({ TableName: Table.tableConfig.name, ...query }).promise();

		if (Table.tableConfig.logger) Table.tableConfig.logger.info(data);

		return {
			...data,
			Attributes: data.Attributes as RV extends 'NONE' | undefined | never
				? undefined
				: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW'
				? A
				: undefined
		};
	};
