import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { flattenDeep } from 'lodash';
import { customAlphabet } from 'nanoid';

interface IUpdateExpressionPart {
	UpdateExpression: NonNullable<DocumentClient.UpdateItemInput['UpdateExpression']>;
	ExpressionAttributeNames: NonNullable<DocumentClient.UpdateItemInput['ExpressionAttributeNames']>;
	ExpressionAttributeValues: NonNullable<DocumentClient.UpdateItemInput['ExpressionAttributeValues']>;
}

const convertObjectToUpdateExpressionParts = <Object extends object>(
	object: Object,
	precedingKeys?: Array<string>
): Array<IUpdateExpressionPart> => {
	return flattenDeep(
		Object.entries(object).map(entry => {
			const [key, value] = entry;

			const attributeName = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890')(10);

			if (value !== null && typeof value === 'object' && !value.length) {
				return [
					{
						UpdateExpression: '',
						ExpressionAttributeNames: {
							[`#${attributeName}`]: String(key)
						},
						ExpressionAttributeValues: {}
					},
					...convertObjectToUpdateExpressionParts(
						value,
						precedingKeys ? [...precedingKeys, attributeName] : [attributeName]
					)
				];
			} else {
				const updateExpressionPart: IUpdateExpressionPart = {
					UpdateExpression: `${
						precedingKeys ? `${precedingKeys.map(key => `#${key}`).join('.')}.` : ''
					}#${attributeName} = :${attributeName}, `,
					ExpressionAttributeNames: {
						[`#${attributeName}`]: String(key)
					},
					ExpressionAttributeValues: {
						[`:${attributeName}`]: value
					}
				};

				return [updateExpressionPart];
			}
		})
	);
};

export const convertObjectToUpdateExpression = <Object extends object>(object: Object) => {
	const updateExpressionBase: IUpdateExpressionPart = {
		UpdateExpression: 'SET ',
		ExpressionAttributeNames: {},
		ExpressionAttributeValues: {}
	};
	const updateExpressionParts = convertObjectToUpdateExpressionParts(object);

	const generatedUpdateExpression = updateExpressionParts.reduce((updateExpression, expressionPart) => {
		return {
			UpdateExpression: updateExpression.UpdateExpression + expressionPart.UpdateExpression,
			ExpressionAttributeNames: {
				...updateExpression.ExpressionAttributeNames,
				...expressionPart.ExpressionAttributeNames
			},
			ExpressionAttributeValues: {
				...updateExpression.ExpressionAttributeValues,
				...expressionPart.ExpressionAttributeValues
			}
		};
	}, updateExpressionBase);

	const updateExpression = {
		...generatedUpdateExpression,
		UpdateExpression: generatedUpdateExpression.UpdateExpression.slice(
			0,
			generatedUpdateExpression.UpdateExpression.length - 2
		)
	};

	return updateExpression;
};
