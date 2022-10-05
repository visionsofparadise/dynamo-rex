import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DeleteItemOutput } from './delete';
import { PutReturnValues, PutItemOutput } from './put';
import { IdxATL, IdxCfgSet, IdxKey } from './Table';
import { UpdateReturnValues, UpdateItemOutput } from './update';

export const hasPutAttributesFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>() =>
	<A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends PutReturnValues>(
		data: DocumentClient.PutItemOutput | DocumentClient.DeleteItemOutput,
		returnValue?: RV
	): asserts data is PutItemOutput<A, RV> | DeleteItemOutput<A, RV> => {
		if (returnValue === 'ALL_OLD' && !data.Attributes) {
			throw new Error('Return values not found');
		}

		if ((returnValue === 'NONE' || !returnValue) && data.Attributes) {
			throw new Error('Return values found when not requested');
		}
	};

export const hasUpdateAttributesFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>() =>
	<A extends IdxKey<TIdxCfg[TPIdxN]>, RV extends UpdateReturnValues>(
		data: DocumentClient.UpdateItemOutput,
		returnValue?: RV
	): asserts data is UpdateItemOutput<A, RV> => {
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
