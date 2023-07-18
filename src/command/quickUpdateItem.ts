import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { GetReturnValuesOutput } from '../util/OutputParams';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { dxUpdateItem } from './updateItem';
import { AllSchema } from '../util/Schema';
import { DxOp } from '../UpdateOp';

export interface DxQuickUpdateItemInput<RV extends ReturnValue | undefined = undefined>
	extends DxReturnParams<RV>,
		DxConditionExpressionParams {}

export type DxQuickUpdateItemOutput<
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = undefined
> = GetReturnValuesOutput<K, RV>;

export const dxQuickUpdateItem = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = undefined
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	updateAttributes: O.Partial<O.Unionize<K['Attributes'], AllSchema<K['Attributes'], DxOp>>, 'deep'>,
	input?: DxQuickUpdateItemInput<RV>
): Promise<DxQuickUpdateItemOutput<K, RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await dxUpdateItem(KeySpace, keyParams, {
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
