import { ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { Table, GetTableIndexCursorKey, GetTableSecondaryIndex, GetTableBaseAttributes } from '../Table';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
	DxFilterExpressionParams,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleFilterExpressionParams,
	handleProjectionExpressionParams,
	handleTableNameParam
} from '../util/InputParams';

export interface DxScanInput<T extends Table = Table, Index extends GetTableSecondaryIndex<T> | never = never>
	extends DxReturnConsumedCapacityParam,
		DxFilterExpressionParams,
		DxProjectionExpressionParams {
	index?: Index;
	limit?: ScanCommandInput['Limit'];
	select?: ScanCommandInput['Select'];
	cursorKey?: GetTableIndexCursorKey<T, Index>;
	totalSegments?: ScanCommandInput['TotalSegments'];
	segment?: ScanCommandInput['Segment'];
	consistentRead?: ScanCommandInput['ConsistentRead'];
}

export type DxScanOutput<T extends Table = Table, Index extends GetTableSecondaryIndex<T> | never = never> = {
	items: Array<GetTableBaseAttributes<T> & GetTableIndexCursorKey<T, Index>>;
	cursorKey?: GetTableIndexCursorKey<T, Index>;
	count: number;
	scannedCount: number;
};

export const dxScan = async <T extends Table = Table, Index extends GetTableSecondaryIndex<T> | never = never>(
	Table: T,
	input?: DxScanInput<T, Index>,
	eventHandlers?: EventHandlers
): Promise<DxScanOutput<T, Index>> => {
	const command = new ScanCommand({
		...handleTableNameParam(Table),
		IndexName: input?.index,
		Limit: input?.limit,
		Select: input?.select,
		ExclusiveStartKey: input?.cursorKey ? marshall(input.cursorKey) : undefined,
		TotalSegments: input?.totalSegments,
		Segment: input?.segment,
		...handleProjectionExpressionParams(input),
		...handleFilterExpressionParams(input),
		ConsistentRead: input?.consistentRead,
		ReturnConsumedCapacity: input?.returnConsumedCapacity || Table.defaults?.returnConsumedCapacity
	});

	const { Items, LastEvaluatedKey, Count, ScannedCount, ConsumedCapacity } = await Table.client.send(command);

	await triggerEventHandlers(
		{
			ConsumedCapacity
		},
		[eventHandlers, Table.eventHandlers]
	);

	const items = (Items ? Items.map(Item => unmarshall(Item)) : []) as Array<
		GetTableBaseAttributes<T> & GetTableIndexCursorKey<T, Index>
	>;
	const cursorKey = (LastEvaluatedKey ? unmarshall(LastEvaluatedKey) : undefined) as GetTableIndexCursorKey<T, Index>;

	return {
		items,
		cursorKey,
		count: Count || 0,
		scannedCount: ScannedCount || 0
	};
};
