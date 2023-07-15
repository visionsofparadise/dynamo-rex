import { KeySpace, GetKeySpaceAttributes } from '../KeySpace';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import {
	DxReturnValues,
	DxConditionExpressionParams,
	DxReturnParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam
} from '../util/InputParams';
import { GetReturnValuesOutput, getReturnValuesAttributes } from '../util/OutputParams';

export type DxPutItemReturnValues = Extract<DxReturnValues, 'allOld' | 'none' | undefined>;

export interface DxPutItemInput<RV extends DxPutItemReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxPutItemOutput<
	K extends KeySpace = KeySpace,
	RV extends DxPutItemReturnValues = undefined
> = GetReturnValuesOutput<K, RV>;

export const dxPutItem = async <K extends KeySpace = KeySpace, RV extends DxPutItemReturnValues = undefined>(
	KeySpace: K,
	item: GetKeySpaceAttributes<K>,
	input?: DxPutItemInput<RV>,
	eventHandlers?: EventHandlers
): Promise<DxPutItemOutput<K, RV>> => {
	const marshalledItem = marshall(KeySpace.withIndexKeys(item));

	const command = new PutItemCommand({
		...handleTableNameParam(KeySpace.Table),
		Item: marshalledItem,
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
