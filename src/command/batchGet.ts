import { GenericAttributes } from '../Dx';
import { PrimaryIndex, Table } from '../Table';
import {
	DxConsistentReadParam,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleConsistentReadParam,
	handleProjectionExpressionParams
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { BatchGetCommand, BatchGetCommandInput, BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';

export interface DxBatchGetInput
	extends DxReturnConsumedCapacityParam,
		DxProjectionExpressionParams,
		DxConsistentReadParam {
	pageLimit?: number;
}

export interface DxBatchGetOutput<T extends Table = Table> {
	items: Array<T['AttributesAndIndexKeys']>;
	unprocessedKeys: Array<T['IndexKeyMap'][PrimaryIndex]>;
}

export interface DxBatchGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<BatchGetCommandOutput, 'Items'> {
	Items?: Array<Attributes>;
}

export const dxBatchGet = async <T extends Table = Table>(
	Table: T,
	keys: Array<T['IndexKeyMap'][PrimaryIndex]>,
	input?: DxBatchGetInput
): Promise<DxBatchGetOutput<T>> => {
	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 100) : 100;

	const recurse = async (remainingKeys: Array<T['IndexKeyMap'][PrimaryIndex]>): Promise<DxBatchGetOutput<T>> => {
		const currentKeys = remainingKeys.slice(0, pageLimit);

		const baseCommandInput: BatchGetCommandInput = {
			RequestItems: {
				[Table.config.name]: {
					Keys: currentKeys,
					...handleProjectionExpressionParams(input),
					...handleConsistentReadParam(input)
				}
			},
			ReturnConsumedCapacity: input?.returnConsumedCapacity || Table.defaults?.returnConsumedCapacity
		};

		const batchGetCommandInput = await executeMiddlewares(
			['CommandInput', 'ReadCommandInput', 'BatchGetCommandInput'],
			{ type: 'BatchGetCommandInput', data: baseCommandInput },
			Table.middleware
		).then(output => output.data);

		const batchGetCommandOutput: DxBatchGetCommandOutput<T['AttributesAndIndexKeys']> = await Table.client.send(
			new BatchGetCommand(batchGetCommandInput)
		);

		const output = await executeMiddlewares(
			['CommandOutput', 'ReadCommandOutput', 'BatchGetCommandOutput'],
			{ type: 'BatchGetCommandOutput', data: batchGetCommandOutput },
			Table.middleware
		).then(output => output.data);

		const { Responses, UnprocessedKeys, ConsumedCapacity } = output;

		await handleOutputMetricsMiddleware({ ConsumedCapacity }, Table.middleware);

		const nextRemainingKeys = remainingKeys.slice(pageLimit);

		const items = Responses ? Responses[Table.config.name] : [];

		const unprocessedKeys =
			UnprocessedKeys && UnprocessedKeys[Table.config.name] && UnprocessedKeys[Table.config.name].Keys
				? (UnprocessedKeys[Table.config.name].Keys as Array<T['IndexKeyMap'][PrimaryIndex]>)
				: [];

		if (nextRemainingKeys.length === 0) {
			return {
				items,
				unprocessedKeys
			};
		}

		const nextPage = await recurse(nextRemainingKeys);

		return {
			items: [...items, ...nextPage.items],
			unprocessedKeys: [...unprocessedKeys, ...nextPage.unprocessedKeys]
		};
	};

	return recurse(keys);
};
