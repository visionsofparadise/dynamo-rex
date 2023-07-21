import { Table } from '../Table';
import {
	DxConsistentReadParam,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleConsistentReadParam,
	handleProjectionExpressionParams
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { BatchGetCommand, BatchGetCommandInput, BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../Dx';

export interface DxBatchGetInput
	extends DxReturnConsumedCapacityParam,
		DxProjectionExpressionParams,
		DxConsistentReadParam {
	pageLimit?: number;
}

export interface DxBatchGetOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	KeyParams extends GenericAttributes = GenericAttributes
> {
	items: Array<Attributes>;
	unprocessedKeys: Array<KeyParams>;
}

export interface DxBatchGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<BatchGetCommandOutput, 'Items'> {
	Items?: Array<Attributes>;
}

export const dxBatchGet = async <TorK extends Table | AnyKeySpace = AnyKeySpace>(
	TableOrKeySpace: TorK,
	keys: Array<Parameters<TorK['handleInputKeyParams']>[0]>,
	input?: DxBatchGetInput
): Promise<DxBatchGetOutput<ReturnType<TorK['handleOutputItem']>, Parameters<TorK['handleInputKeyParams']>[0]>> => {
	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 100) : 100;

	const recurse = async (
		remainingKeys: Array<Parameters<TorK['handleInputKeyParams']>[0]>
	): Promise<
		DxBatchGetOutput<NonNullable<ReturnType<TorK['handleOutputItem']>>, Parameters<TorK['handleInputKeyParams']>[0]>
	> => {
		const currentKeys = remainingKeys.slice(0, pageLimit);

		const baseCommandInput: BatchGetCommandInput = {
			RequestItems: {
				[TableOrKeySpace.tableName]: {
					Keys: currentKeys.map(kp => TableOrKeySpace.handleInputKeyParams(kp)),
					...handleProjectionExpressionParams(input),
					...handleConsistentReadParam(input)
				}
			},
			ReturnConsumedCapacity: input?.returnConsumedCapacity || TableOrKeySpace.defaults.returnConsumedCapacity
		};

		const batchGetCommandInput = await executeMiddlewares(
			['CommandInput', 'ReadCommandInput', 'BatchGetCommandInput'],
			{ type: 'BatchGetCommandInput', data: baseCommandInput },
			TableOrKeySpace.middleware
		).then(output => output.data);

		const batchGetCommandOutput: DxBatchGetCommandOutput<TorK['AttributesAndIndexKeys']> =
			await TableOrKeySpace.client.send(new BatchGetCommand(batchGetCommandInput));

		const output = await executeMiddlewares(
			['CommandOutput', 'ReadCommandOutput', 'BatchGetCommandOutput'],
			{ type: 'BatchGetCommandOutput', data: batchGetCommandOutput },
			TableOrKeySpace.middleware
		).then(output => output.data);

		const { Responses, UnprocessedKeys, ConsumedCapacity } = output;

		await handleOutputMetricsMiddleware({ ConsumedCapacity }, TableOrKeySpace.middleware);

		const nextRemainingKeys = remainingKeys.slice(pageLimit);

		const items = (Responses ? Responses[TableOrKeySpace.tableName] : []).map(i => TableOrKeySpace.handleOutputItem(i));

		const unprocessedKeys =
			UnprocessedKeys && UnprocessedKeys[TableOrKeySpace.tableName] && UnprocessedKeys[TableOrKeySpace.tableName].Keys
				? (UnprocessedKeys[TableOrKeySpace.tableName].Keys as Array<Parameters<TorK['handleInputKeyParams']>[0]>)
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
