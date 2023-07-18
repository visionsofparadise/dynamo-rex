import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import {
	DxConditionExpressionParams,
	DxReturnParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam
} from '../util/InputParams';
import { GetReturnValuesOutput, getReturnValuesAttributes } from '../util/OutputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

type DxDeleteItemReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DxDeleteItemInput<RV extends DxDeleteItemReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxDeleteItemOutput<
	K extends AnyKeySpace = AnyKeySpace,
	RV extends DxDeleteItemReturnValues = undefined
> = GetReturnValuesOutput<K, RV>;

export interface DxDeleteCommandOutput<
	Attributes extends Record<string, NativeAttributeValue> = Record<string, NativeAttributeValue>
> extends Omit<DeleteCommandOutput, 'Attributes'> {
	Attributes?: Attributes;
}

export const dxDeleteItem = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends DxDeleteItemReturnValues = undefined
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input?: DxDeleteItemInput<RV>
): Promise<DxDeleteItemOutput<K, RV>> => {
	const baseCommandInput: DeleteCommandInput = {
		...handleTableNameParam(KeySpace.Table),
		Key: KeySpace.keyOf(keyParams),
		...handleConditionExpressionParams(input),
		...handleReturnParams(KeySpace, input)
	};

	const deleteCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'DeleteCommandInput'],
		{ type: 'DeleteCommandInput', data: baseCommandInput },
		KeySpace.middleware
	).then(output => output.data);

	const deleteCommandOutput: DxDeleteCommandOutput<K['AttributesAndIndexKeys']> = await KeySpace.client.send(
		new DeleteCommand(deleteCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'DeleteCommandOutput'],
		{ type: 'DeleteCommandOutput', data: deleteCommandOutput },
		KeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, KeySpace.middleware);

	const attributes = getReturnValuesAttributes(KeySpace, output.Attributes, input?.returnValues);

	return attributes;
};
