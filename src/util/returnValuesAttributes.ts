import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../Dx';

export type DxFullReturnValues = Extract<ReturnValue, 'ALL_NEW' | 'ALL_OLD'>;
export type DxPartialReturnValues = Extract<ReturnValue, 'UPDATED_NEW' | 'UPDATED_OLD'>;

export type ReturnValuesAttributes<
	Attributes extends GenericAttributes | Partial<GenericAttributes> | undefined,
	ReturnValues extends ReturnValue | undefined
> = ReturnValues extends DxFullReturnValues
	? Attributes
	: ReturnValues extends DxPartialReturnValues
	? Partial<Attributes>
	: undefined;

export const assertReturnValuesAttributes: <
	Attributes extends GenericAttributes,
	ReturnValues extends ReturnValue | undefined
>(
	attributes?: Attributes | Partial<Attributes> | undefined,
	returnValues?: ReturnValues
) => asserts attributes is ReturnValuesAttributes<Attributes, ReturnValues> = (attributes, returnValues) => {
	if (
		(returnValues === ReturnValue.ALL_NEW ||
			returnValues === ReturnValue.ALL_OLD ||
			returnValues === ReturnValue.UPDATED_NEW ||
			returnValues === ReturnValue.UPDATED_OLD) &&
		!attributes
	)
		throw new Error();
	if ((!returnValues || returnValues === ReturnValue.NONE) && attributes) throw new Error();
};
