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

export enum QueryItemsSort {
	ASCENDING = 'ascending',
	DESCENDING = 'descending'
}

export interface DxQueryItemsInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
> extends DxReturnConsumedCapacityParam,
		DxFilterExpressionParams,
		DxProjectionExpressionParams,
		DxListParams<Index>,
		DxConsistentReadParam {
	keyConditionExpression: QueryCommandInput['KeyConditionExpression'];
	sort?: QueryItemsSort;
	cursorKey?: Table.GetIndexCursorKey<K['Table'], Index>;
}

export type DxQueryItemsOutput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
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

export const dxQueryItems = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
>(
	KeySpace: K,
	input: DxQueryItemsInput<K, Index>
): Promise<DxQueryItemsOutput<K, Index>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<K['Table'], Index>
	): Promise<DxQueryItemsOutput<K, Index>> => {
		const baseCommandInput: QueryCommandInput = {
			...handleTableNameParam(KeySpace.Table),
			KeyConditionExpression: input.keyConditionExpression,
			ScanIndexForward:
				input.sort === QueryItemsSort.ASCENDING ? true : input.sort === QueryItemsSort.DESCENDING ? false : undefined,
			ExclusiveStartKey: pageCursorKey as Record<string, any> | undefined,
			...handleListParams(input),
			...handleProjectionExpressionParams(input),
			...handleFilterExpressionParams(input),
			...handleConsistentReadParam(input),
			...handleReturnConsumedCapacityParam(KeySpace, input)
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
