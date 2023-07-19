import { KeySpace, AnyKeySpace } from '../KeySpace';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { dxPut } from './put';

export interface DxCreateInput extends Omit<DxReturnParams, 'returnValues'>, DxConditionExpressionParams {}

export type DxCreateOutput = void;

export const dxCreate = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	item: K['Attributes'],
	input?: DxCreateInput
): Promise<DxCreateOutput> => {
	await dxPut(KeySpace, item, {
		...input,
		conditionExpression: `attribute_not_exists(#hashKey)${
			input?.conditionExpression ? ` ${input?.conditionExpression}` : ''
		}`,
		expressionAttributeNames: {
			'#hashKey': KeySpace.Table.config.indexes.primaryIndex.hash.key,
			...input?.expressionAttributeNames
		}
	});

	return;
};
