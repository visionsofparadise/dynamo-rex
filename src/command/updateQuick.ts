import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { GetReturnValuesOutput } from '../util/OutputParams';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { dxUpdate } from './update';
import { AllSchema } from '../util/Schema';
import { DxOp } from '../UpdateOp';

export interface DxUpdateQuickInput<RV extends ReturnValue | undefined = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxUpdateQuickOutput<
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = undefined
> = GetReturnValuesOutput<K, RV>;

export const dxUpdateQuick = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = undefined
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	updateAttributes: O.Partial<O.Unionize<K['Attributes'], AllSchema<K['Attributes'], DxOp>>, 'deep'>,
	input?: DxUpdateQuickInput<RV>
): Promise<DxUpdateQuickOutput<K, RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await dxUpdate(KeySpace, keyParams, {
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
