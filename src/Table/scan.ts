import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasItems } from './hasItem';
import { IdxATL, IdxKey, MCfg, IdxCfg } from './Table';

export type ScanInput<
	TPIdxN extends string & keyof IdxKeyMap,
	SIdx extends Exclude<keyof IdxKeyMap, TPIdxN> | never,
	IdxKeyMap extends Record<string, IdxKey<IdxCfg<string, string, IdxATL, IdxATL>>>
> = Assign<
	NoTN<DocumentClient.ScanInput>,
	{
		IndexName?: SIdx;
		ExclusiveStartKey?: IdxKeyMap[TPIdxN] & (SIdx extends Exclude<keyof IdxKeyMap, TPIdxN> ? IdxKeyMap[SIdx] : {});
	}
>;

export type ScanOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.ScanOutput,
	{
		Items: Array<A>;
	}
>;

export const scanFn =
	<
		TPIdxN extends string & keyof IdxKeyMap,
		IdxKeyMap extends Record<string, IdxKey<IdxCfg<string, string, IdxATL, IdxATL>>>
	>(
		config: MCfg
	) =>
	async <A extends IdxKeyMap[TPIdxN], SIdx extends (string & Exclude<keyof IdxKeyMap, TPIdxN>) | never>(
		query?: ScanInput<TPIdxN, SIdx, IdxKeyMap>
	): Promise<ScanOutput<A>> => {
		const fallbackQuery = query || {};

		const data = await config.client.scan({ TableName: config.name, ...fallbackQuery }).promise();

		if (config.logger) config.logger.info(data);

		hasItems<A>(data);

		return data;
	};
