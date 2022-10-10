import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTN } from '../utils';
import { hasItems } from './hasItem';
import { IdxATL, IdxKey, MCfg, IdxCfg } from './Table';

export type QueryInput<
	TPIdxN extends string & keyof IdxKeyMap,
	SIdx extends (string & Exclude<keyof IdxKeyMap, TPIdxN>) | never,
	IdxKeyMap extends Record<string, IdxKey<IdxCfg<string, string, IdxATL, IdxATL>>>
> = Assign<
	NoTN<DocumentClient.QueryInput>,
	{
		IndexName?: SIdx;
		ExclusiveStartKey?: IdxKeyMap[TPIdxN] &
			(SIdx extends string & Exclude<keyof IdxKeyMap, TPIdxN> ? IdxKeyMap[SIdx] : {});
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
		TPIdxN extends string & keyof IdxKeyMap,
		IdxKeyMap extends Record<string, IdxKey<IdxCfg<string, string, IdxATL, IdxATL>>>
	>(
		config: MCfg
	) =>
	async <A extends IdxKeyMap[TPIdxN], SIdx extends (string & Exclude<keyof IdxKeyMap, TPIdxN>) | never>(
		query: QueryInput<TPIdxN, SIdx, IdxKeyMap>
	): Promise<QueryOutput<A>> => {
		const data = await config.client
			.query({ TableName: config.name, ...query, IndexName: query.IndexName && String(query.IndexName) })
			.promise();

		if (config.logger) config.logger.info(data);

		hasItems<A>(data);

		return data;
	};
