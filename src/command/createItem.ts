import { KeySpace, AnyKeySpace } from '../KeySpace';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { dxPutItem } from './putItem';

export interface DxCreateItemInput extends Omit<DxReturnParams, 'returnValues'>, DxConditionExpressionParams {}

export type DxCreateItemOutput = void;

export const dxCreateItem = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	item: K['Attributes'],
	input?: DxCreateItemInput
): Promise<DxCreateItemOutput> => {
	await dxPutItem(KeySpace, item, {
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
