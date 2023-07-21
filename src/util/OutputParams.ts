import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxFullReturnValues, DxPartialReturnValues } from './InputParams';
import { GenericAttributes } from '../Dx';

export type GetReturnValuesOutput<
	Attributes extends GenericAttributes,
	RV extends ReturnValue | undefined
> = RV extends DxFullReturnValues ? Attributes : RV extends DxPartialReturnValues ? Partial<Attributes> : undefined;

export const assertReturnValuesAttributes: <
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = undefined
>(
	attributes?: Attributes | Partial<Attributes>,
	returnValues?: RV
) => asserts attributes is GetReturnValuesOutput<Attributes, RV> = (attributes, returnValues) => {
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
