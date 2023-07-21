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
import { PutCommand, PutCommandInput, PutCommandOutput } from '@aws-sdk/lib-dynamodb';
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
	K extends AnyKeySpace = AnyKeySpace,
	RV extends DxPutReturnValues = undefined
> = GetReturnValuesOutput<K, RV>;

export interface DxPutCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<PutCommandOutput, 'Attributes'> {
	Attributes?: Attributes;
}

export const dxPut = async <K extends AnyKeySpace = AnyKeySpace, RV extends DxPutReturnValues = undefined>(
	KeySpace: K,
	item: K['Attributes'],
	input?: DxPutInput<RV>
): Promise<DxPutOutput<K, RV>> => {
	const baseCommandInput: DxPutCommandInput<K['AttributesAndIndexKeys']> = {
		...handleTableNameParam(KeySpace.Table),
		Item: KeySpace.withIndexKeys(item),
		...handleConditionExpressionParams(input),
		...handleReturnParams(KeySpace, input)
	};

	const putCommandInput = await executeMiddlewares(
		['CommandInput', 'WriteCommandInput', 'PutCommandInput'],
		{ type: 'PutCommandInput', data: baseCommandInput },
		KeySpace.middleware
	).then(output => output.data);

	const putCommandOutput: DxPutCommandOutput<K['AttributesAndIndexKeys']> = await KeySpace.client.send(
		new PutCommand(putCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'WriteCommandOutput', 'PutCommandOutput'],
		{ type: 'PutCommandOutput', data: putCommandOutput },
		KeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, KeySpace.middleware);

	const attributes = getReturnValuesAttributes(KeySpace, output.Attributes, input?.returnValues);

	return attributes;
};
