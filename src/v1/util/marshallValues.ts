import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export const marshallValues = (input?: Record<string, any>): Record<string, AttributeValue> | undefined => {
	if (!input) return undefined;

	const entries = Object.entries(input);

	const marshalledEntries = entries.map(([key, value]) => [key, marshall(value)]);

	return Object.fromEntries(marshalledEntries);
};
