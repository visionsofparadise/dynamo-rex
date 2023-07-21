import { QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import {
	DxConsistentReadParam,
	DxFilterExpressionParams,
	DxListParams,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleConsistentReadParam,
	handleFilterExpressionParams,
	handleListParams,
	handleProjectionExpressionParams,
	handleReturnConsumedCapacityParam,
	handleTableNameParam
} from '../util/InputParams';
import { AnyKeySpace } from '../KeySpace';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export enum DxQueryItemsSort {
	ASCENDING = 'ascending',
	DESCENDING = 'descending'
}

export interface DxQueryInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
> extends DxReturnConsumedCapacityParam,
		DxFilterExpressionParams,
		DxProjectionExpressionParams,
		DxListParams<Index>,
		DxConsistentReadParam {
	keyConditionExpression: QueryCommandInput['KeyConditionExpression'];
	sort?: DxQueryItemsSort;
	cursorKey?: Table.GetIndexCursorKey<K['Table'], Index>;
}

export type DxQueryOutput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
> = {
	items: Array<K['Attributes']>;
	cursorKey?: Table.GetIndexCursorKey<K['Table'], Index>;
	count: number;
};

export interface DxQueryCommandOutput<
	Attributes extends Record<string, NativeAttributeValue> = Record<string, NativeAttributeValue>
> extends Omit<QueryCommandOutput, 'Attributes'> {
	Items?: Array<Attributes>;
}

export const dxQuery = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: DxQueryInput<K, Index>
): Promise<DxQueryOutput<K, Index>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<K['Table'], Index>
	): Promise<DxQueryOutput<K, Index>> => {
		const baseCommandInput: QueryCommandInput = {
			...handleTableNameParam(KeySpace.Table),
			KeyConditionExpression: input.keyConditionExpression,
			ScanIndexForward:
				input.sort === DxQueryItemsSort.ASCENDING
					? true
					: input.sort === DxQueryItemsSort.DESCENDING
					? false
					: undefined,
			ExclusiveStartKey: pageCursorKey as Record<string, any> | undefined,
			...handleListParams(input),
			...handleProjectionExpressionParams(input),
			...handleFilterExpressionParams(input),
			...handleConsistentReadParam(input),
			...handleReturnConsumedCapacityParam(input, KeySpace.defaults)
		};

		const queryCommandInput = await executeMiddlewares(
			['CommandInput', 'ReadCommandInput', 'QueryCommandInput'],
			{ type: 'QueryCommandInput', data: baseCommandInput },
			KeySpace.middleware
		).then(output => output.data);

		const queryCommandOutput: DxQueryCommandOutput<K['AttributesAndIndexKeys']> = await KeySpace.client.send(
			new QueryCommand(queryCommandInput)
		);

		const output = await executeMiddlewares(
			['CommandOutput', 'ReadCommandOutput', 'QueryCommandOutput'],
			{ type: 'QueryCommandOutput', data: queryCommandOutput },
			KeySpace.middleware
		).then(output => output.data);

		await handleOutputMetricsMiddleware(output, KeySpace.middleware);

		const { Items, LastEvaluatedKey, Count } = output;

		const items = Items ? Items.map(Item => KeySpace.omitIndexKeys(Item)) : [];
		const cursorKey = LastEvaluatedKey as Table.GetIndexCursorKey<K['Table'], Index> | undefined;
		const count = Count || 0;

		const newTotalCount = totalCount + items.length;

		if (!input.autoPage || !cursorKey || (input?.totalLimit && newTotalCount >= input.totalLimit)) {
			return {
				items: items.slice(0, input?.totalLimit),
				cursorKey,
				count
			};
		}

		const nextPage = await recurse(newTotalCount, cursorKey);

		return {
			items: [...items, ...nextPage.items].slice(0, input?.totalLimit),
			cursorKey: nextPage.cursorKey,
			count: count + nextPage.count
		};
	};

	return recurse(0, input?.cursorKey);
};
