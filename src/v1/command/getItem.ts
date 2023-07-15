import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { KeySpace, GetKeySpaceAttributes, GetKeySpaceIndexValueParams } from '../KeySpace';
import { EventHandlers, triggerEventHandlers } from '../util/eventHandlers';
import { PrimaryIndex } from '../Table';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleProjectionExpressionParams,
	handleReturnConsumedCapacityParam,
	handleTableNameParam
} from '../util/InputParams';

export interface DxGetItemInput extends DxReturnConsumedCapacityParam, DxProjectionExpressionParams {
	consistentRead?: GetItemCommandInput['ConsistentRead'];
}

export type DxGetItemOutput<K extends KeySpace> = GetKeySpaceAttributes<K>;

export const dxGetItem = async <K extends KeySpace>(
	KeySpace: K,
	keyParams: GetKeySpaceIndexValueParams<K, PrimaryIndex>,
	input?: DxGetItemInput,
	eventHandlers?: EventHandlers
): Promise<DxGetItemOutput<K>> => {
	const key = KeySpace.keyOf(keyParams);

	const command = new GetItemCommand({
		...handleTableNameParam(KeySpace.Table),
		Key: marshall(key),
		...handleProjectionExpressionParams(input),
		...handleReturnConsumedCapacityParam(KeySpace, input)
	});

	const { Item, ConsumedCapacity } = await KeySpace.Table.client.send(command);

	await triggerEventHandlers(
		{
			ConsumedCapacity
		},
		[eventHandlers, KeySpace.eventHandlers, KeySpace.Table.eventHandlers]
	);

	if (!Item) throw new Error('Not Found');

	const item = KeySpace.omitIndexKeys(unmarshall(Item));

	return item;
};
