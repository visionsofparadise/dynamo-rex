import { KeySpace, GetKeySpaceAttributes } from '../KeySpace';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import {
	DxConditionExpressionParams,
	DxReturnParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam
} from '../util/InputParams';

export interface DxCreateItemInput extends Omit<DxReturnParams, 'returnValues'>, DxConditionExpressionParams {}

export type DxCreateItemOutput = undefined;

export const dxCreateItem = async <K extends KeySpace>(
	KeySpace: K,
	item: GetKeySpaceAttributes<K>,
	input?: DxCreateItemInput,
	eventHandlers?: EventHandlers
): Promise<DxCreateItemOutput> => {
	const marshalledItem = marshall(KeySpace.withIndexKeys(item));

	const command = new PutItemCommand({
		...handleTableNameParam(KeySpace.Table),
		Item: marshalledItem,
		...handleConditionExpressionParams(input),
		ConditionExpression: `attribute_not_exists(#hashKey)${
			input?.conditionExpression ? ` ${input?.conditionExpression}` : ''
		}`,
		ExpressionAttributeNames: {
			'#hashKey': KeySpace.Table.config.indexes.primaryIndex.hash.key,
			...input?.expressionAttributeNames
		},
		...handleReturnParams(KeySpace, input)
	});

	const { ConsumedCapacity, ItemCollectionMetrics } = await KeySpace.Table.client.send(command);

	await triggerEventHandlers(
		{
			ConsumedCapacity,
			ItemCollectionMetrics
		},
		[eventHandlers, KeySpace.eventHandlers, KeySpace.Table.eventHandlers]
	);

	return undefined;
};
