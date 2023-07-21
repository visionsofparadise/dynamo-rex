import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import {
	DxConditionExpressionParams,
	DxReturnParams,
	handleConditionExpressionParams,
	handleReturnParams,
	handleTableNameParam
} from '../util/InputParams';
import { GetReturnValuesOutput, assertReturnValuesAttributes } from '../util/OutputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

type DxDeleteItemReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DxDeleteInput<RV extends DxDeleteItemReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxDeleteOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DxDeleteItemReturnValues = undefined
> = GetReturnValuesOutput<Attributes, RV>;

export interface DxDeleteCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<DeleteCommandOutput, 'Attributes'> {
	Attributes?: Attributes;
}

export const dxDelete = async <
	TorK extends Table | AnyKeySpace = AnyKeySpace,
	RV extends DxDeleteItemReturnValues = undefined
>(
	TableOrKeySpace: TorK,
	keyParams: Parameters<TorK['handleInputKeyParams']>[0],
	input?: DxDeleteInput<RV>
): Promise<DxDeleteOutput<ReturnType<TorK['handleOutputItem']>, RV>> => {
	const baseCommandInput: DeleteCommandInput = {
		...handleTableNameParam(TableOrKeySpace),
		Key: TableOrKeySpace.handleInputKeyParams(keyParams),
		...handleConditionExpressionParams(input),
		...handleReturnParams(input, TableOrKeySpace.defaults)
	};

	const deleteCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'DeleteCommandInput'],
		{ type: 'DeleteCommandInput', data: baseCommandInput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	const deleteCommandOutput: DxDeleteCommandOutput<TorK['AttributesAndIndexKeys']> = await TableOrKeySpace.client.send(
		new DeleteCommand(deleteCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'DeleteCommandOutput'],
		{ type: 'DeleteCommandOutput', data: deleteCommandOutput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, TableOrKeySpace.middleware);

	const { Attributes } = output;

	assertReturnValuesAttributes(Attributes, input?.returnValues);

	return TableOrKeySpace.handleOutputItem(Attributes);
};
