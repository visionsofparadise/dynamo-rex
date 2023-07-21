import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import {
	DxConditionExpressionParams,
	DxReturnParams,
	DxUpdateExpressionParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam,
	handleUpdateExpressionParams
} from '../util/InputParams';
import { GetReturnValuesOutput, getReturnValuesAttributes } from '../util/OutputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { GenericAttributes } from '../Dx';

export interface DxUpdateInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends DxReturnParams<RV>,
		DxUpdateExpressionParams,
		DxConditionExpressionParams {}

export type DxUpdateOutput<
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = GetReturnValuesOutput<K, RV>;

export interface DxUpdateCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<UpdateCommandOutput, 'Attributes'> {
	Attributes?: Attributes | Partial<Attributes>;
}

export const dxUpdate = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	input: DxUpdateInput<RV>
): Promise<DxUpdateOutput<K, RV>> => {
	const baseCommandInput: UpdateCommandInput = {
		...handleTableNameParam(KeySpace.Table),
		Key: KeySpace.keyOf(keyParams),
		...handleUpdateExpressionParams(input),
		...handleConditionExpressionParams(input),
		...handleReturnParams(KeySpace, input),
		ReturnValues: handleReturnParams(KeySpace, input).ReturnValues || ReturnValue.ALL_NEW
	};

	const updateCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'UpdateCommandInput'],
		{ type: 'UpdateCommandInput', data: baseCommandInput },
		KeySpace.middleware
	).then(output => output.data);

	const updateCommandOutput = await KeySpace.client.send(new UpdateCommand(updateCommandInput));

	const commandOutput = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'UpdateCommandOutput'],
		{ type: 'UpdateCommandOutput', data: updateCommandOutput },
		KeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(commandOutput, KeySpace.middleware);

	const attributes = getReturnValuesAttributes(KeySpace, commandOutput.Attributes, input?.returnValues);

	return attributes;
};
