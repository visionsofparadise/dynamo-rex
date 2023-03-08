import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { chunk, wait } from '../utils';
import { GetItemInput } from './get';
import { IdxCfgM, IdxKey, MCfg, TIdxN } from './Table';

export type BatchWriteInput<Key extends DocumentClient.GetItemInput['Key']> = Array<
	{ PutRequest: DocumentClient.PutRequest } | { DeleteRequest: { Key: GetItemInput<Key>['Key'] } }
>;

export const batchWritePageFn = <TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) => {
	const batchWritePage = async (
		requests: BatchWriteInput<IdxKey<TIdxCfgM[TPIdxN]>>,
		depth: number = 0
	): Promise<Array<DocumentClient.BatchWriteItemOutput>> => {
		try {
			const data = await config.client
				.batchWrite({
					RequestItems: {
						[config.name]: requests
					}
				})
				.promise();

			if (data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0 && depth < 5) {
				await wait(depth * depth * 1000);

				const nextData = await batchWritePage(
					data.UnprocessedItems[config.name] as BatchWriteInput<IdxKey<TIdxCfgM[TPIdxN]>>,
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

	return batchWritePage;
};

export const batchWriteFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async (requests: BatchWriteInput<IdxKey<TIdxCfgM[TPIdxN]>>): Promise<Array<DocumentClient.BatchWriteItemOutput>> => {
		const results: Array<DocumentClient.BatchWriteItemOutput> = [];

		const batchWritePage = batchWritePageFn(config);

		const batches = chunk(requests, 25);

		for (const batch of batches) {
			const batchResult = await batchWritePage(batch);

			results.push(...batchResult);
		}

		if (config.logger) config.logger.info(results);

		return results;
	};
