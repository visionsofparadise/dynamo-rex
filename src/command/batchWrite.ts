import { GenericAttributes } from '../Dx';
import { PrimaryIndex, Table } from '../Table';
import { DxReturnParams } from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DeleteRequest, PutRequest, WriteRequest } from '@aws-sdk/client-dynamodb';

export interface DxBatchPutRequest<T extends Table = Table> {
	put: T['AttributesAndIndexKeys'];
}

export interface DxBatchDeleteRequest<T extends Table = Table> {
	delete: T['IndexKeyMap'][PrimaryIndex];
}

export interface DxBatchWriteInput
	extends Pick<DxReturnParams, 'returnConsumedCapacity' | 'returnItemCollectionMetrics'> {
	pageLimit?: number;
}

export interface DxBatchWriteCommandInput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<BatchWriteCommandInput, 'RequestItems'> {
	RequestItems: Record<
		string,
		(Omit<WriteRequest, 'PutRequest' | 'DeleteRequest'> & {
			PutRequest?: Omit<PutRequest, 'Item'> & {
				Item: Attributes;
			};
			DeleteRequest?: Omit<DeleteRequest, 'Key'> & {
				Key: GenericAttributes;
			};
		})[]
	>;
}

export interface DxBatchWriteOutput<T extends Table = Table> {
	unprocessedRequests: Array<DxBatchPutRequest<T> | DxBatchDeleteRequest<T>>;
}

export interface DxBatchWriteCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<BatchWriteCommandOutput, 'UnprocessedItems'> {
	UnprocessedItems?: Record<
		string,
		(Omit<WriteRequest, 'PutRequest' | 'DeleteRequest'> & {
			PutRequest?: Omit<PutRequest, 'Item'> & {
				Item: Attributes | undefined;
			};
			DeleteRequest?: Omit<DeleteRequest, 'Key'> & {
				Key: GenericAttributes | undefined;
			};
		})[]
	>;
}

export const dxBatchWrite = async <T extends Table = Table>(
	Table: T,
	requests: Array<DxBatchPutRequest<T> | DxBatchDeleteRequest<T>>,
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<T>> => {
	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: Array<DxBatchPutRequest<T> | DxBatchDeleteRequest<T>>
	): Promise<DxBatchWriteOutput<T>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const baseCommandInput: DxBatchWriteCommandInput<T['AttributesAndIndexKeys']> = {
			RequestItems: {
				[Table.config.name]: currentRequests.map(request => {
					if ('put' in request) {
						return {
							PutRequest: {
								Item: request.put
							}
						};
					}

					return {
						DeleteRequest: {
							Key: request.delete
						}
					};
				})
			},
			ReturnItemCollectionMetrics: input?.returnItemCollectionMetrics || Table.defaults?.returnItemCollectionMetrics,
			ReturnConsumedCapacity: input?.returnConsumedCapacity || Table.defaults?.returnConsumedCapacity
		};

		const batchWriteCommandInput = await executeMiddlewares(
			['CommandInput', 'WriteCommandInput', 'BatchWriteCommandInput'],
			{ type: 'BatchWriteCommandInput', data: baseCommandInput },
			Table.middleware
		).then(output => output.data);

		const batchWriteCommandOutput: DxBatchWriteCommandOutput<T['AttributesAndIndexKeys']> = await Table.client.send(
			new BatchWriteCommand(batchWriteCommandInput)
		);

		const output = await executeMiddlewares(
			['CommandOutput', 'WriteCommandOutput', 'BatchWriteCommandOutput'],
			{ type: 'BatchWriteCommandOutput', data: batchWriteCommandOutput },
			Table.middleware
		).then(output => output.data);

		const { UnprocessedItems, ConsumedCapacity, ItemCollectionMetrics } = output;

		await handleOutputMetricsMiddleware({ ConsumedCapacity, ItemCollectionMetrics }, Table.middleware);

		const unprocessedRequests = (UnprocessedItems ? UnprocessedItems[Table.config.name] || [] : [])
			.map(request => {
				if (request.PutRequest?.Item) {
					return {
						put: request.PutRequest.Item
					};
				}

				if (request.DeleteRequest?.Key) {
					return {
						delete: request.DeleteRequest.Key as T['IndexKeyMap'][PrimaryIndex]
					};
				}

				return undefined;
			})
			.filter((request): request is NonNullable<typeof request> => !!request);

		const nextRemainingRequests = remainingRequests.slice(pageLimit);

		if (nextRemainingRequests.length === 0) {
			return {
				unprocessedRequests
			};
		}

		const nextPage = await recurse(nextRemainingRequests);

		return {
			unprocessedRequests: [...unprocessedRequests, ...nextPage.unprocessedRequests]
		};
	};

	return recurse(requests);
};
