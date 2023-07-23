import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { DxUpdateInput, DxUpdateOutput, dxTableUpdate } from './update';
import { AllSchema } from '../util/Schema';
import { DxOp } from '../UpdateOp';
import { GenericAttributes } from '../Dx';
import { Table } from '../Table';

export interface DxUpdateQuickInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends DxUpdateInput<RV> {}

export type DxUpdateQuickOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = DxUpdateOutput<Attributes, RV>;

export const dxTableUpdateQuick = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	updateAttributes: O.Partial<O.Unionize<T['Attributes'], AllSchema<T['Attributes'], DxOp>>, 'deep'>,
	input?: DxUpdateQuickInput<RV>
): Promise<DxUpdateQuickOutput<T['AttributesAndIndexKeys'], RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await dxTableUpdate(Table, key, {
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

export const dxUpdateQuick = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	updateAttributes: O.Partial<O.Unionize<K['Attributes'], AllSchema<K['Attributes'], DxOp>>, 'deep'>,
	input?: DxUpdateQuickInput<RV>
): Promise<DxUpdateQuickOutput<K['Attributes'], RV>> => {
	const attributes = await dxTableUpdateQuick(
		KeySpace.Table,
		KeySpace.keyOf(keyParams as any),
		updateAttributes,
		input
	);

	return attributes;
};
