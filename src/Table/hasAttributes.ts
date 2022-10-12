import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DeleteItemOutput } from './delete';
import { PutReturnValues, PutItemOutput } from './put';
import { UpdateReturnValues, UpdateItemOutput } from './update';

export const hasPutAttributes: <A extends object, RV extends PutReturnValues = never>(
	data: DocumentClient.PutItemOutput | DocumentClient.DeleteItemOutput,
	returnValue?: RV
) => asserts data is PutItemOutput<A, RV> | DeleteItemOutput<A, RV> = (data, returnValue) => {
	if (returnValue === 'ALL_OLD' && !data.Attributes) {
		throw new Error('Return values not found');
	}

	if ((returnValue === 'NONE' || !returnValue) && data.Attributes) {
		throw new Error('Return values found when not requested');
	}
};

export const hasUpdateAttributes: <A extends object, RV extends UpdateReturnValues = never>(
	data: DocumentClient.UpdateItemOutput,
	returnValue?: RV
) => asserts data is UpdateItemOutput<A, RV> = (data, returnValue) => {
	if (
		returnValue === 'ALL_OLD' ||
		returnValue === 'ALL_NEW' ||
		returnValue === 'UPDATED_OLD' ||
		(returnValue === 'UPDATED_NEW' && !data.Attributes)
	) {
		throw new Error('Return values not found');
	}

	if ((returnValue === 'NONE' || !returnValue) && data.Attributes) {
		throw new Error('Return values found when not requested');
	}
};
