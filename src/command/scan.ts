import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
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
	handleTableNameParam
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export interface DxScanInput<T extends Table = Table, Index extends T['SecondaryIndex'] | never = never>
	extends DxReturnConsumedCapacityParam,
		DxFilterExpressionParams,
		DxProjectionExpressionParams,
		DxListParams<Index>,
		DxConsistentReadParam {
	cursorKey?: Table.GetIndexCursorKey<T, Index>;
	totalSegments?: ScanCommandInput['TotalSegments'];
	segment?: ScanCommandInput['Segment'];
}

export type DxScanOutput<T extends Table = Table, Index extends T['SecondaryIndex'] | never = never> = {
	items: Array<T['AttributesAndIndexKeys']>;
	cursorKey?: Table.GetIndexCursorKey<T, Index>;
	count: number;
	scannedCount: number;
};

export interface DxScanCommandOutput<
	Attributes extends Record<string, NativeAttributeValue> = Record<string, NativeAttributeValue>
> extends Omit<ScanCommandOutput, 'Attributes'> {
	Items?: Array<Attributes>;
}

export const dxScan = async <T extends Table = Table, Index extends T['SecondaryIndex'] | never = never>(
	Table: T,
	input?: DxScanInput<T, Index>
): Promise<DxScanOutput<T, Index>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<T, Index>
	): Promise<DxScanOutput<T, Index>> => {
		const baseCommandInput: ScanCommandInput = {
			...handleTableNameParam(Table),
			ExclusiveStartKey: pageCursorKey as Record<string, any> | undefined,
			TotalSegments: input?.totalSegments,
			Segment: input?.segment,
			...handleListParams(input),
			...handleProjectionExpressionParams(input),
			...handleFilterExpressionParams(input),
			...handleConsistentReadParam(input),
			ReturnConsumedCapacity: input?.returnConsumedCapacity || Table.defaults?.returnConsumedCapacity
		};

		const scanCommandInput = await executeMiddlewares(
			['CommandInput', 'ReadCommandInput', 'ScanCommandInput'],
			{ type: 'ScanCommandInput', data: baseCommandInput },
			Table.middleware
		).then(output => output.data);

		const scanCommandOutput: DxScanCommandOutput<T['AttributesAndIndexKeys']> = await Table.client.send(
			new ScanCommand(scanCommandInput)
		);

		const output = await executeMiddlewares(
			['CommandOutput', 'ReadCommandOutput', 'ScanCommandOutput'],
			{ type: 'ScanCommandOutput', data: scanCommandOutput },
			Table.middleware
		).then(output => output.data);

		await handleOutputMetricsMiddleware(output, Table.middleware);

		const { Items, LastEvaluatedKey, Count, ScannedCount } = output;

		const items = Items || [];
		const cursorKey = LastEvaluatedKey as Table.GetIndexCursorKey<T, Index> | undefined;
		const count = Count || 0;
		const scannedCount = ScannedCount || 0;

		const newTotalCount = totalCount + items.length;

		if ((input && !input.autoPage) || !cursorKey || (input?.totalLimit && newTotalCount >= input.totalLimit)) {
			return {
				items: items.slice(0, input?.totalLimit),
				cursorKey,
				count,
				scannedCount
			};
		}

		const nextPage = await recurse(newTotalCount, cursorKey);

		return {
			items: [...items, ...nextPage.items].slice(0, input?.totalLimit),
			cursorKey: nextPage.cursorKey,
			count: count + nextPage.count,
			scannedCount: scannedCount + nextPage.scannedCount
		};
	};

	return recurse(0, input?.cursorKey);
};
