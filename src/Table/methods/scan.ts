import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export type ScanInput<
	TIdxN extends PropertyKey,
	TPIdxN extends TIdxN,
	TIdxA extends PropertyKey,
	TIdxAL extends IdxALiteral,
	IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>,
	SIdx extends Exclude<TIdxN, TPIdxN>
> = Omit<DocumentClient.ScanInput, 'TableName' | 'IndexName' | 'LastEvaluatedKey'> & {
	IndexName?: SIdx;
	ExclusiveStartKey: IdxCfg[TPIdxN]['key'] & IdxCfg[SIdx]['key'];
};

export type ScanOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.ScanOutput, 'Items'> & {
	Items?: Array<A>;
};

export const scan =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap, SIdx extends string & Exclude<TIdxN, TPIdxN>>(
		query?: ScanInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, SIdx>
	): Promise<ScanOutput<A>> => {
		const fallbackQuery = query || {};

		const data = await Table.tableConfig.client.scan({ TableName: Table.tableConfig.name, ...fallbackQuery }).promise();

		if (Table.tableConfig.logger) Table.tableConfig.logger.info(data);

		return {
			...data,
			Items: (data.Items || []) as Array<A>
		};
	};
