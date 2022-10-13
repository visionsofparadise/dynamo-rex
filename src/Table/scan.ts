import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { assertItems } from './assertItem';
import { QueryInput, QueryOutput } from './query';
import { IdxATL, MCfg, IdxCfgM, NotPIdxN, TIdxN } from './Table';

export type ScanInput<
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL>
> = QueryInput<IdxN, TPIdxN, TIdxCfgM>;

export type ScanOutput<
	A extends DocumentClient.AttributeMap,
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = QueryOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>;

export const scanFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async <
		A extends DocumentClient.AttributeMap,
		IdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never
	>(
		query?: ScanInput<IdxN, TPIdxN, TIdxCfgM>
	): Promise<ScanOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>> => {
		const fallbackQuery = query || {};

		const data = await config.client.scan({ TableName: config.name, ...fallbackQuery }).promise();

		if (config.logger) config.logger.info(data);

		assertItems<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>(data);

		return data;
	};
