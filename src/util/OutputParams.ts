import { AnyKeySpace } from '../KeySpace';
import { run } from './utils';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DxFullReturnValues, DxPartialReturnValues } from './InputParams';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export type GetReturnValuesOutput<
	K extends AnyKeySpace,
	RV extends ReturnValue | undefined
> = RV extends DxFullReturnValues
	? K['Attributes']
	: RV extends DxPartialReturnValues
	? Partial<K['Attributes']>
	: undefined;

const assertAttributes: <K extends AnyKeySpace = AnyKeySpace, RV extends ReturnValue | undefined = undefined>(
	attributes?: K['Attributes'] | Partial<K['Attributes']>,
	returnValues?: RV
) => asserts attributes is GetReturnValuesOutput<K, RV> = (attributes, returnValues) => {
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

export const getReturnValuesAttributes = <K extends AnyKeySpace, RV extends ReturnValue | undefined>(
	KeySpace: K,
	Attributes?: Record<string, NativeAttributeValue>,
	returnValues?: RV
): GetReturnValuesOutput<K, RV> => {
	const attributes = run(() => {
		if (!returnValues || returnValues === ReturnValue.NONE || !Attributes) return undefined;

		return KeySpace.omitIndexKeys(Attributes);
	});

	assertAttributes<K, RV>(attributes, returnValues);

	return attributes;
};
