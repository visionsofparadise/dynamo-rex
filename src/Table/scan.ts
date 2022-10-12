import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasItems } from './hasItem';
import { QueryA } from './query';
import { IdxATL, MCfg, IdxCfgM, IdxCfgMToKeyM, IdxP, NotPIdxN, TIdxN } from './Table';

export type ScanInput<
	TPIdxN extends TIdxN<TIdxCfgM>,
	TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
> = Assign<
	NoTN<DocumentClient.ScanInput>,
	{
		IndexName?: TSIdxN;
		ExclusiveStartKey?: IdxCfgMToKeyM<TIdxCfgM>[TPIdxN] &
			(TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> ? IdxCfgMToKeyM<TIdxCfgM>[TSIdxN] : {});
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
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		config: MCfg
	) =>
	async <A extends DocumentClient.AttributeMap, TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never = never>(
		query?: ScanInput<TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>
	): Promise<ScanOutput<QueryA<A, TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>>> => {
		const fallbackQuery = query || {};

		const data = await config.client.scan({ TableName: config.name, ...fallbackQuery }).promise();

		if (config.logger) config.logger.info(data);

		hasItems<QueryA<A, TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>>(data);

		return data;
	};
