import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DeleteItemOutput } from './delete';
import { PutReturnValues, PutItemOutput } from './put';
import { IdxCfgM, NotPIdxN, TIdxN } from './Table';
import { UpdateReturnValues, UpdateItemOutput } from './update';

export const assertPutAttributes: <
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
>(
	data: DocumentClient.PutItemOutput | DocumentClient.DeleteItemOutput,
	returnValue?: RV
) => asserts data is
	| PutItemOutput<A, RV, ISIdxN, TPIdxN, TIdxCfgM>
	| DeleteItemOutput<A, RV, ISIdxN, TPIdxN, TIdxCfgM> = (data, returnValue) => {
	if (returnValue === 'ALL_OLD' && !data.Attributes) {
		throw new Error('Return values not found');
	}

	if ((returnValue === 'NONE' || !returnValue) && data.Attributes) {
		throw new Error('Return values found when not requested');
	}
};

export const assertUpdateAttributes: <
	A extends DocumentClient.AttributeMap,
	RV extends UpdateReturnValues,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
>(
	data: DocumentClient.UpdateItemOutput,
	returnValue?: RV
) => asserts data is UpdateItemOutput<A, RV, ISIdxN, TPIdxN, TIdxCfgM> = (data, returnValue) => {
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
