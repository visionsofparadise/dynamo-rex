import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DeleteItemOutput } from './delete';
import { PutReturnValues, PutItemOutput } from './put2';
import { Cfg, CfgSIdxN } from './Table2';
import { UpdateReturnValues, UpdateItemOutput } from './update';

export const assertPutAttributes: <
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends CfgSIdxN<TCfg>,
	TCfg extends Cfg
>(
	data: DocumentClient.PutItemOutput | DocumentClient.DeleteItemOutput,
	returnValue?: RV
) => asserts data is PutItemOutput<A, RV, ISIdxN, TCfg> = (data, returnValue) => {
	if (returnValue === 'ALL_OLD' && !data.Attributes) {
		throw new Error('Return values not found');
	}

	if ((returnValue === 'NONE' || !returnValue) && data.Attributes) {
		throw new Error('Return values found when not requested');
	}
};
