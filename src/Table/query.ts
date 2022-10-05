import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTableName } from '../utils';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type QueryInput<
	TPIdxN extends string & keyof TIdxCfg,
	SIdx extends Exclude<keyof TIdxCfg, TPIdxN> | never,
	TIdxCfg extends IdxCfgSet<string, IdxATL>
> = Assign<
	NoTableName<DocumentClient.QueryInput>,
	{
		IndexName?: SIdx;
		ExclusiveStartKey?: IdxKey<TIdxCfg[TPIdxN]> & SIdx extends Exclude<keyof TIdxCfg, TPIdxN>
			? IdxKey<TIdxCfg[SIdx]>
			: {};
	}
>;

export type QueryOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.QueryOutput,
	{
		Items: Array<A>;
	}
>;

export const queryFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, SIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never>(
		query: QueryInput<TPIdxN, SIdx, TIdxCfg>
	): Promise<QueryOutput<A>> => {
		const data = await Table.config.client
			.query({ TableName: Table.config.name, ...query, IndexName: query.IndexName && String(query.IndexName) })
			.promise();

		if (Table.config.logger) Table.config.logger.info(data);

		Table.hasItems<A>(data);

		return data;
	};
