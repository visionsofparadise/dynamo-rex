import { Table } from '../Table';
import { AnyKeySpace } from '../KeySpace';
import { DxConditionExpressionParams, DxReturnParams } from '../util/InputParams';
import { dxPut } from './put';

export interface DxCreateInput extends Omit<DxReturnParams, 'returnValues'>, DxConditionExpressionParams {}

export type DxCreateOutput = void;

export const dxCreate = async <TorK extends Table | AnyKeySpace = AnyKeySpace>(
	TableOrKeySpace: TorK,
	item: Parameters<TorK['handleInputItem']>[0],
	input?: DxCreateInput
): Promise<DxCreateOutput> => {
	await dxPut(TableOrKeySpace, item, {
		...input,
		conditionExpression: `attribute_not_exists(#hashKey)${
			input?.conditionExpression ? ` ${input?.conditionExpression}` : ''
		}`,
		expressionAttributeNames: {
			'#hashKey': TableOrKeySpace.indexConfig.primaryIndex.hash.key,
			...input?.expressionAttributeNames
		}
	});

	return;
};
