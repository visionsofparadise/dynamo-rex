import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { AnyKeySpace } from '../KeySpace';
import {
	DxConsistentReadParam,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleConsistentReadParam,
	handleProjectionExpressionParams,
	handleReturnConsumedCapacityParam,
	handleTableNameParam
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { GetCommand, GetCommandInput, GetCommandOutput } from '@aws-sdk/lib-dynamodb';

export interface DxGetInput
	extends DxReturnConsumedCapacityParam,
		DxProjectionExpressionParams,
		DxConsistentReadParam {}

export type DxGetOutput<K extends AnyKeySpace = AnyKeySpace> = K['Attributes'];

export interface DxGetCommandOutput<
	Attributes extends Record<string, NativeAttributeValue> = Record<string, NativeAttributeValue>
> extends Omit<GetCommandOutput, 'Attributes'> {
	Item?: Attributes;
}

export const dxGet = async <K extends AnyKeySpace>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: DxGetInput
): Promise<DxGetOutput<K>> => {
	const baseCommandInput: GetCommandInput = {
		...handleTableNameParam(KeySpace.Table),
		Key: KeySpace.keyOf(keyParams),
		...handleProjectionExpressionParams(input),
		...handleConsistentReadParam(input),
		...handleReturnConsumedCapacityParam(KeySpace, input)
	};

	const getCommandInput = await executeMiddlewares(
		['CommandInput', 'ReadCommandInput', 'GetCommandInput'],
		{ type: 'GetCommandInput', data: baseCommandInput },
		KeySpace.middleware
	).then(output => output.data);

	const getCommandOutput: DxGetCommandOutput<K['AttributesAndIndexKeys']> = await KeySpace.client.send(
		new GetCommand(getCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'ReadCommandOutput', 'GetCommandOutput'],
		{ type: 'GetCommandOutput', data: getCommandOutput },
		KeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, KeySpace.middleware);

	if (!output.Item) throw new Error('Not Found');

	const item = KeySpace.omitIndexKeys(output.Item);

	return item;
};
