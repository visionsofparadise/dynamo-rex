import { unmarshall } from '@aws-sdk/util-dynamodb';
import { GetKeySpaceAttributes, KeySpace } from '../KeySpace';
import { run } from './utils';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { DxFullReturnValues, DxPartialReturnValues, DxReturnValues } from './InputParams';

export type GetReturnValuesOutput<K extends KeySpace, RV extends DxReturnValues> = RV extends DxFullReturnValues
	? GetKeySpaceAttributes<K>
	: RV extends DxPartialReturnValues
	? Partial<GetKeySpaceAttributes<K>>
	: undefined;

const assertAttributes: <K extends KeySpace = KeySpace, RV extends DxReturnValues = undefined>(
	attributes?: GetKeySpaceAttributes<K> | Partial<GetKeySpaceAttributes<K>>,
	returnValues?: RV
) => asserts attributes is GetReturnValuesOutput<K, RV> = (attributes, returnValues) => {
	if (
		(returnValues === 'allOld' ||
			returnValues === 'allNew' ||
			returnValues === 'updatedNew' ||
			returnValues === 'updatedOld') &&
		!attributes
	)
		throw new Error();
	if ((!returnValues || returnValues === 'none') && attributes) throw new Error();
};

export const getReturnValuesAttributes = <K extends KeySpace, RV extends DxReturnValues>(
	KeySpace: K,
	Attributes?: Record<string, AttributeValue>,
	returnValues?: RV
): GetReturnValuesOutput<K, RV> => {
	const attributes = run(() => {
		if (!returnValues || returnValues === 'none' || !Attributes) return undefined;

		return KeySpace.omitIndexKeys(unmarshall(Attributes));
	});

	assertAttributes<K, RV>(attributes, returnValues);

	return attributes;
};
