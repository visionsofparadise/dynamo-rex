import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export type QueryInput<
	TIdxN extends PropertyKey,
	TPIdxN extends TIdxN,
	TIdxA extends PropertyKey,
	TIdxAL extends IdxALiteral,
	IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>,
	SIdx extends Exclude<TIdxN, TPIdxN>
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'LastEvaluatedKey'> & {
	IndexName?: SIdx;
	ExclusiveStartKey?: IdxCfg[TPIdxN]['key'] & IdxCfg[SIdx]['key'];
};

export type QueryOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.QueryOutput, 'Items'> & {
	Items: Array<A>;
};

export const query =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap, SIdx extends Exclude<TIdxN, TPIdxN>>(
		query: QueryInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, SIdx>
	): Promise<QueryOutput<A>> => {
		const data = await Table.tableConfig.client
			.query({ TableName: Table.tableConfig.name, ...query, IndexName: query.IndexName && String(query.IndexName) })
			.promise();

		if (Table.tableConfig.logger) Table.tableConfig.logger.info(data);

		return {
			...data,
			Items: (data.Items || []) as Array<A>
		};
	};
