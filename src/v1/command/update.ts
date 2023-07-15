import { KeySpace, GetKeySpaceIndexValueParams } from '../KeySpace';
import { marshall } from '@aws-sdk/util-dynamodb';
import { UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
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

export type DxUpdateItemReturnValues = DxReturnValues;

export interface DxUpdateItemInput<RV extends DxUpdateItemReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {
	updateExpression: UpdateItemCommandInput['UpdateExpression'];
}

export type DxUpdateItemOutput<
	K extends KeySpace = KeySpace,
	RV extends DxUpdateItemReturnValues = undefined
> = GetReturnValuesOutput<K, RV>;

export const dxUpdateItem = async <K extends KeySpace = KeySpace, RV extends DxUpdateItemReturnValues = undefined>(
	KeySpace: K,
	keyParams: GetKeySpaceIndexValueParams<K, PrimaryIndex>,
	input: DxUpdateItemInput<RV>,
	eventHandlers?: EventHandlers
): Promise<DxUpdateItemOutput<K, RV>> => {
	const key = KeySpace.keyOf(keyParams);

	const command = new UpdateItemCommand({
		...handleTableNameParam(KeySpace.Table),
		Key: marshall(key),
		UpdateExpression: input.updateExpression,
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
