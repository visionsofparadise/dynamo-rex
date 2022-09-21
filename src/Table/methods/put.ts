import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Omit<
	DocumentClient.PutItemInput,
	'TableName' | 'Item' | 'ReturnValues'
> & {
	Item: A;
	ReturnValues?: RV;
};

export type PutItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Omit<
	DocumentClient.PutItemOutput,
	'Attributes'
> & {
	Attributes: RV extends 'NONE' | undefined | never ? undefined : RV extends 'ALL_OLD' ? A : undefined;
};

export const put =
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
		query: PutItemInput<A, RV>
	): Promise<PutItemOutput<A, RV>> => {
		const data = await Table.tableConfig.client.put({ TableName: Table.tableConfig.name, ...query }).promise();

		if (Table.tableConfig.logger) Table.tableConfig.logger.info(data);

		return {
			...data,
			Attributes: data.Attributes as RV extends 'NONE' | undefined | never
				? undefined
				: RV extends 'ALL_OLD'
				? A
				: undefined
		};
	};
