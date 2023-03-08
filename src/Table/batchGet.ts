import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, chunk, wait } from '../utils';
import { IdxCfgM, IdxKey, MCfg, TIdxN } from './Table';

export type BatchGetInput<Key extends DocumentClient.GetItemInput['Key']> = Assign<
	DocumentClient.KeysAndAttributes,
	{ Keys: Array<Key> }
>;

export const batchGetPageFn = <TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) => {
	const batchGetPage = async (
		keys: Array<IdxKey<TIdxCfgM[TPIdxN]>>,
		query: Omit<DocumentClient.KeysAndAttributes, 'Keys'> = {},
		depth: number = 0
	): Promise<Array<DocumentClient.BatchGetItemOutput>> => {
		try {
			const data = await config.client
				.batchGet({
					RequestItems: {
						[config.name]: {
							Keys: keys,
							...query
						}
					}
				})
				.promise();

			if (data.UnprocessedKeys && Object.keys(data.UnprocessedKeys).length > 0 && depth < 5) {
				await wait(depth * depth * 1000);

				const nextData = await batchGetPage(
					data.UnprocessedKeys[config.name].Keys as Array<IdxKey<TIdxCfgM[TPIdxN]>>,
					query,
					depth + 1
				);

				return [data, ...nextData];
			} else {
				return [data];
			}
		} catch (error) {
			if (config.logger) config.logger.info(error);

			return [];
		}
	};

	return batchGetPage;
};

export const batchGetFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async (
		keys: Array<IdxKey<TIdxCfgM[TPIdxN]>>,
		query: Omit<DocumentClient.KeysAndAttributes, 'Keys'> = {}
	): Promise<Array<DocumentClient.BatchGetItemOutput>> => {
		const results: Array<DocumentClient.BatchGetItemOutput> = [];

		const batchGetPage = batchGetPageFn(config);

		const batches = chunk(keys, 100);

		for (const batch of batches) {
			const batchResult = await batchGetPage(batch, query);

			results.push(...batchResult);
		}

		if (config.logger) config.logger.info(results);

		return results;
	};
