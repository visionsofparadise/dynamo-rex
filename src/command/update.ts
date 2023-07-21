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
import { GetReturnValuesOutput, assertReturnValuesAttributes } from '../util/OutputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

export interface DxUpdateInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends DxReturnParams<RV>,
		DxUpdateExpressionParams,
		DxConditionExpressionParams {}

export type DxUpdateOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = GetReturnValuesOutput<Attributes, RV>;

export interface DxUpdateCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<UpdateCommandOutput, 'Attributes'> {
	Attributes?: Attributes | Partial<Attributes>;
}

export const dxUpdate = async <
	TorK extends Table | AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	TableOrKeySpace: TorK,
	keyParams: Parameters<TorK['handleInputKeyParams']>[0],
	input: DxUpdateInput<RV>
): Promise<DxUpdateOutput<ReturnType<TorK['handleOutputItem']>, RV>> => {
	const baseCommandInput: UpdateCommandInput = {
		...handleTableNameParam(TableOrKeySpace),
		Key: TableOrKeySpace.handleInputKeyParams(keyParams),
		...handleUpdateExpressionParams(input),
		...handleConditionExpressionParams(input),
		...handleReturnParams(input, TableOrKeySpace.defaults),
		ReturnValues: handleReturnParams(input, TableOrKeySpace.defaults).ReturnValues || ReturnValue.ALL_NEW
	};

	const updateCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'UpdateCommandInput'],
		{ type: 'UpdateCommandInput', data: baseCommandInput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	const updateCommandOutput = await TableOrKeySpace.client.send(new UpdateCommand(updateCommandInput));

	const output = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'UpdateCommandOutput'],
		{ type: 'UpdateCommandOutput', data: updateCommandOutput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, TableOrKeySpace.middleware);

	const { Attributes } = output;

	assertReturnValuesAttributes(Attributes, input?.returnValues || ReturnValue.ALL_NEW);

	return TableOrKeySpace.handleOutputItem(Attributes);
};
