import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { GetTableIndexCursorKey } from '../Table';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
	DxFilterExpressionParams,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleFilterExpressionParams,
	handleProjectionExpressionParams,
	handleReturnConsumedCapacityParam,
	handleTableNameParam
} from '../util/InputParams';
import { GetKeySpaceAttributes, GetKeySpaceSecondaryIndex, KeySpace } from '../KeySpace';

export enum QueryItemsSort {
	ASCENDING = 'ascending',
	DESCENDING = 'descending'
}

export interface DxQueryInput<K extends KeySpace = KeySpace, Index extends GetKeySpaceSecondaryIndex<K> | never = never>
	extends DxReturnConsumedCapacityParam,
		DxFilterExpressionParams,
		DxProjectionExpressionParams {
	keyConditionExpression: QueryCommandInput['KeyConditionExpression'];
	sort?: QueryItemsSort;
	index?: Index;
	limit?: QueryCommandInput['Limit'];
	select?: QueryCommandInput['Select'];
	cursorKey?: GetTableIndexCursorKey<K['Table'], Index>;
	consistentRead?: QueryCommandInput['ConsistentRead'];
}

export type DxQueryOutput<K extends KeySpace = KeySpace, Index extends GetKeySpaceSecondaryIndex<K> | never = never> = {
	items: Array<GetKeySpaceAttributes<K>>;
	cursorKey?: GetTableIndexCursorKey<K['Table'], Index>;
	count: number;
};

export const dxQuery = async <
	K extends KeySpace = KeySpace,
	Index extends GetKeySpaceSecondaryIndex<K> | never = never
>(
	KeySpace: K,
	input: DxQueryInput<K, Index>,
	eventHandlers?: EventHandlers
): Promise<DxQueryOutput<K, Index>> => {
	const command = new QueryCommand({
		...handleTableNameParam(KeySpace.Table),
		IndexName: input.index,
		KeyConditionExpression: input.keyConditionExpression,
		ScanIndexForward:
			input.sort === QueryItemsSort.ASCENDING ? true : input.sort === QueryItemsSort.DESCENDING ? false : undefined,
		Limit: input.limit,
		Select: input.select,
		ExclusiveStartKey: input.cursorKey ? marshall(input.cursorKey) : undefined,
		...handleProjectionExpressionParams(input),
		...handleFilterExpressionParams(input),
		ConsistentRead: input.consistentRead,
		...handleReturnConsumedCapacityParam(KeySpace, input)
	});

	const { Items, LastEvaluatedKey, Count, ConsumedCapacity } = await KeySpace.Table.client.send(command);

	await triggerEventHandlers(
		{
			ConsumedCapacity
		},
		[eventHandlers, KeySpace.eventHandlers, KeySpace.Table.eventHandlers]
	);

	const items = (Items ? Items.map(Item => unmarshall(Item)) : []) as Array<GetKeySpaceAttributes<K>>;
	const cursorKey = (LastEvaluatedKey ? unmarshall(LastEvaluatedKey) : undefined) as GetTableIndexCursorKey<
		K['Table'],
		Index
	>;

	return {
		items,
		cursorKey,
		count: Count || 0
	};
};
