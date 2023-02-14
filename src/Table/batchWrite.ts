import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemInput } from './get';
import { IdxCfgM, IdxKey, MCfg, TIdxN } from './Table';

export type BatchWriteInput<Key extends DocumentClient.GetItemInput['Key']> = Array<
	{ PutRequest: DocumentClient.PutRequest } | { DeleteRequest: { Key: GetItemInput<Key>['Key'] } }
>;

export const batchWriteFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async (query: BatchWriteInput<IdxKey<TIdxCfgM[TPIdxN]>>): Promise<DocumentClient.BatchWriteItemOutput> => {
		const data = await config.client
			.batchWrite({
				RequestItems: {
					[config.name]: query
				}
			})
			.promise();

		if (config.logger) config.logger.info(data);

		return data;
	};
