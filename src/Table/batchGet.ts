import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign } from '../utils';
import { IdxCfgM, IdxKey, MCfg, TIdxN } from './Table';

export type BatchGetInput<Key extends DocumentClient.GetItemInput['Key']> = Assign<
	DocumentClient.KeysAndAttributes,
	{ Keys: Array<Key> }
>;

export const batchGetFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async (query: BatchGetInput<IdxKey<TIdxCfgM[TPIdxN]>>): Promise<DocumentClient.BatchGetItemOutput> => {
		const data = await config.client
			.batchGet({
				RequestItems: {
					[config.name]: query
				}
			})
			.promise();

		if (config.logger) config.logger.info(data);

		return data;
	};
