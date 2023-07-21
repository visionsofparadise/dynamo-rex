import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { GetReturnValuesOutput } from '../util/OutputParams';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { dxUpdate } from './update';
import { AllSchema } from '../util/Schema';
import { DxOp } from '../UpdateOp';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

export interface DxUpdateQuickInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxUpdateQuickOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = GetReturnValuesOutput<Attributes, RV>;

export const dxUpdateQuick = async <
	TorK extends Table | AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	TableOrKeySpace: TorK,
	keyParams: Parameters<TorK['handleInputKeyParams']>[0],
	updateAttributes: O.Partial<O.Unionize<TorK['Attributes'], AllSchema<TorK['Attributes'], DxOp>>, 'deep'>,
	input?: DxUpdateQuickInput<RV>
): Promise<DxUpdateQuickOutput<ReturnType<TorK['handleOutputItem']>, RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await dxUpdate(TableOrKeySpace, keyParams, {
		...input,
		...updateExpressionParams,
		expressionAttributeNames: {
			...updateExpressionParams.expressionAttributeNames,
			...input?.expressionAttributeNames
		},
		expressionAttributeValues: {
			...updateExpressionParams.expressionAttributeValues,
			...input?.expressionAttributeValues
		}
	});

	return attributes;
};
