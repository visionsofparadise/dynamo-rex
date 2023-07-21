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
import { PutCommand, PutCommandInput, PutCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

export type DxPutReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DxPutInput<RV extends DxPutReturnValues = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export interface DxPutCommandInput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<PutCommandInput, 'Item'> {
	Item: Attributes;
}

export type DxPutOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DxPutReturnValues = undefined
> = GetReturnValuesOutput<Attributes, RV>;

export interface DxPutCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<PutCommandOutput, 'Attributes'> {
	Attributes?: Attributes;
}

export const dxPut = async <TorK extends Table | AnyKeySpace = AnyKeySpace, RV extends DxPutReturnValues = undefined>(
	TableOrKeySpace: TorK,
	item: Parameters<TorK['handleInputItem']>[0],
	input?: DxPutInput<RV>
): Promise<DxPutOutput<ReturnType<TorK['handleOutputItem']>, RV>> => {
	const baseCommandInput: DxPutCommandInput<TorK['AttributesAndIndexKeys']> = {
		...handleTableNameParam(TableOrKeySpace),
		Item: TableOrKeySpace.handleInputItem(item),
		...handleConditionExpressionParams(input),
		...handleReturnParams(input, TableOrKeySpace.defaults)
	};

	const putCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'PutCommandInput'],
		{ type: 'PutCommandInput', data: baseCommandInput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	const putCommandOutput: DxPutCommandOutput<TorK['AttributesAndIndexKeys']> = await TableOrKeySpace.client.send(
		new PutCommand(putCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'PutCommandOutput'],
		{ type: 'PutCommandOutput', data: putCommandOutput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, TableOrKeySpace.middleware);

	const { Attributes } = output;

	assertReturnValuesAttributes(Attributes, input?.returnValues);

	return TableOrKeySpace.handleOutputItem(Attributes);
};
