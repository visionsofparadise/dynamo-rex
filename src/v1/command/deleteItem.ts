import { KeySpace, GetKeySpaceIndexValueParams } from '../KeySpace';
import { marshall } from '@aws-sdk/util-dynamodb';
import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import { PrimaryIndex } from '../Table';
import {
	DxReturnValues,
	DxConditionExpressionParams,
	DxReturnParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam
} from '../util/InputParams';
import { GetReturnValuesOutput, getReturnValuesAttributes } from '../util/OutputParams';

type DxDeleteItemReturnValues = Extract<DxReturnValues, 'allOld' | 'none' | undefined>;

export interface DxDeleteItemInput<RV extends DxDeleteItemReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxDeleteItemOutput<
	K extends KeySpace = KeySpace,
	RV extends DxDeleteItemReturnValues = undefined
> = GetReturnValuesOutput<K, RV>;

export const dxDeleteItem = async <K extends KeySpace = KeySpace, RV extends DxDeleteItemReturnValues = undefined>(
	KeySpace: K,
	keyParams: GetKeySpaceIndexValueParams<K, PrimaryIndex>,
	input?: DxDeleteItemInput<RV>,
	eventHandlers?: EventHandlers
): Promise<DxDeleteItemOutput<K, RV>> => {
	const key = KeySpace.keyOf(keyParams);

	const command = new DeleteItemCommand({
		...handleTableNameParam(KeySpace.Table),
		Key: marshall(key),
		...handleConditionExpressionParams(input),
		...handleReturnParams(KeySpace, input)
	});

	const { Attributes, ConsumedCapacity, ItemCollectionMetrics } = await KeySpace.Table.client.send(command);

	await triggerEventHandlers(
		{
			ConsumedCapacity,
			ItemCollectionMetrics
		},
		[eventHandlers, KeySpace.eventHandlers, KeySpace.Table.eventHandlers]
	);

	const attributes = getReturnValuesAttributes(KeySpace, Attributes, input?.returnValues);

	return attributes;
};
