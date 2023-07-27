import { AnyKeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { UpdateItemInput, UpdateItemOutput, updateTableItem } from './update';
import { AllSchema } from '../util/Schema';
import { DkOp } from '../UpdateOp';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { DkClient } from '../Client';

export interface UpdateQuickItemInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends UpdateItemInput<RV> {}

export type UpdateQuickItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = UpdateItemOutput<Attributes, RV>;

export const updateQuickTableItem = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: T['IndexKeyMap'][T['PrimaryIndex']],
	updateAttributes: O.Partial<O.Unionize<T['Attributes'], AllSchema<T['Attributes'], DkOp>>, 'deep'>,
	input?: UpdateQuickItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<UpdateQuickItemOutput<T['Attributes'], RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await updateTableItem(
		Table,
		key,
		{
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
		},
		dkClient
	);

	return attributes;
};

export const updateQuickItem = async <
	K extends AnyKeySpace = AnyKeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: Parameters<K['keyOf']>[0],
	updateAttributes: O.Partial<O.Unionize<K['Attributes'], AllSchema<K['Attributes'], DkOp>>, 'deep'>,
	input?: UpdateQuickItemInput<RV>
): Promise<UpdateQuickItemOutput<K['Attributes'], RV>> => {
	const attributes = await updateQuickTableItem(
		KeySpace.Table,
		KeySpace.keyOf(keyParams as any),
		updateAttributes,
		input,
		KeySpace.dkClient
	);

	const strippedAttributes = (attributes ? KeySpace.omitIndexKeys(attributes) : undefined) as ReturnValuesAttributes<
		K['Attributes'],
		RV
	>;

	return strippedAttributes;
};
