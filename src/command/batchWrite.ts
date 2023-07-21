import { Table } from '../Table';
import { DxReturnParams } from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DeleteRequest, PutRequest, WriteRequest } from '@aws-sdk/client-dynamodb';
import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../Dx';

export interface DxBatchPutRequest<Attributes extends GenericAttributes = GenericAttributes> {
	put: Attributes;
}

export interface DxBatchDeleteRequest<KeyParams extends GenericAttributes = GenericAttributes> {
	delete: KeyParams;
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

export interface DxBatchWriteOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	KeyParams extends GenericAttributes = GenericAttributes
> {
	unprocessedRequests: Array<DxBatchPutRequest<Attributes> | DxBatchDeleteRequest<KeyParams>>;
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

export const dxBatchWrite = async <TorK extends Table | AnyKeySpace = AnyKeySpace>(
	TableOrKeySpace: TorK,
	requests: Array<
		| DxBatchPutRequest<Parameters<TorK['handleInputItem']>[0]>
		| DxBatchDeleteRequest<Parameters<TorK['handleInputKeyParams']>[0]>
	>,
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<TorK['AttributesAndIndexKeys'], TorK['IndexKeyMap'][TorK['PrimaryIndex']]>> => {
	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: Array<
			| DxBatchPutRequest<Parameters<TorK['handleInputItem']>[0]>
			| DxBatchDeleteRequest<Parameters<TorK['handleInputKeyParams']>[0]>
		>
	): Promise<DxBatchWriteOutput<any>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const baseCommandInput: DxBatchWriteCommandInput<TorK['AttributesAndIndexKeys']> = {
			RequestItems: {
				[TableOrKeySpace.tableName]: currentRequests.map(request => {
					if ('put' in request) {
						return {
							PutRequest: {
								Item: TableOrKeySpace.handleInputItem(request.put)
							}
						};
					}

					return {
						DeleteRequest: {
							Key: TableOrKeySpace.handleInputKeyParams(request.delete)
						}
					};
				})
			},
			ReturnItemCollectionMetrics:
				input?.returnItemCollectionMetrics || TableOrKeySpace.defaults?.returnItemCollectionMetrics,
			ReturnConsumedCapacity: input?.returnConsumedCapacity || TableOrKeySpace.defaults?.returnConsumedCapacity
		};

		const batchWriteCommandInput = await executeMiddlewares(
			['CommandInput', 'WriteCommandInput', 'BatchWriteCommandInput'],
			{ type: 'BatchWriteCommandInput', data: baseCommandInput },
			TableOrKeySpace.middleware
		).then(output => output.data);

		const batchWriteCommandOutput: DxBatchWriteCommandOutput<TorK['AttributesAndIndexKeys']> =
			await TableOrKeySpace.client.send(new BatchWriteCommand(batchWriteCommandInput));

		const output = await executeMiddlewares(
			['CommandOutput', 'WriteCommandOutput', 'BatchWriteCommandOutput'],
			{ type: 'BatchWriteCommandOutput', data: batchWriteCommandOutput },
			TableOrKeySpace.middleware
		).then(output => output.data);

		const { UnprocessedItems, ConsumedCapacity, ItemCollectionMetrics } = output;

		await handleOutputMetricsMiddleware({ ConsumedCapacity, ItemCollectionMetrics }, TableOrKeySpace.middleware);

		const unprocessedRequests = (UnprocessedItems ? UnprocessedItems[TableOrKeySpace.tableName] || [] : [])
			.map(request => {
				if (request.PutRequest?.Item) {
					return {
						put: request.PutRequest.Item
					};
				}

				if (request.DeleteRequest?.Key) {
					return {
						delete: request.DeleteRequest.Key as TorK['IndexKeyMap'][TorK['PrimaryIndex']]
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
