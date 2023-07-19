import { DxUpdateExpressionParams } from './InputParams';
import { DxOp } from '../UpdateOp';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

const createUpdateExpressionPart = (
	alias: string,
	key: string,
	value: NativeAttributeValue,
	precedingKeys?: Array<string>
): DxUpdateExpressionParams => ({
	updateExpression: `${
		precedingKeys ? `${precedingKeys.map(key => `#${key}`).join('.')}.` : ''
	}#${alias} = :${alias}, `,
	expressionAttributeNames: {
		[`#${alias}`]: key
	},
	expressionAttributeValues: {
		[`:${alias}`]: value
	}
});

const createUpdateExpressionParts = <Attributes extends Record<string, NativeAttributeValue>>(
	attributes: Attributes,
	precedingKeys?: Array<string>
): Array<DxUpdateExpressionParams> => {
	return Object.entries(attributes).flatMap(entry => {
		const [key, value] = entry;

		const alias = [...(precedingKeys || []), key].join('_');

		if (value instanceof DxOp) {
			const updateExpressionPart = value.createUpdateExpressionPart({ key, alias, precedingKeys });

			return [updateExpressionPart];
		}

		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			const updateExpressionPrecedingKeyPart = {
				updateExpression: '',
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {}
			};

			return [
				updateExpressionPrecedingKeyPart,
				...createUpdateExpressionParts(value, precedingKeys ? [...precedingKeys, alias] : [alias])
			];
		}

		const updateExpressionPart = createUpdateExpressionPart(alias, key, value, precedingKeys);

		return [updateExpressionPart];
	});
};

export const convertObjectToUpdateExpression = <Attributes extends Record<string, NativeAttributeValue>>(
	attributes: Attributes
) => {
	const base: Required<DxUpdateExpressionParams> = {
		updateExpression: 'SET ',
		expressionAttributeNames: {},
		expressionAttributeValues: {}
	};

	const parts = createUpdateExpressionParts(attributes);

	if (parts.length === 0) throw new Error('Invalid update object');

	const merged = parts.reduce((accumulator, expressionPart) => {
		return {
			updateExpression: (accumulator.updateExpression || '') + expressionPart.updateExpression,
			expressionAttributeNames: {
				...accumulator.expressionAttributeNames,
				...expressionPart.expressionAttributeNames
			},
			expressionAttributeValues: {
				...accumulator.expressionAttributeValues,
				...expressionPart.expressionAttributeValues
			}
		};
	}, base);

	const updateExpression = {
		...merged,
		updateExpression:
			merged.updateExpression && merged.updateExpression.length > 4
				? merged.updateExpression.trim().slice(0, -1)
				: merged.updateExpression
	};

	return updateExpression;
};