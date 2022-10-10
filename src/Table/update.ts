import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTN } from '../utils';
import { hasUpdateAttributes } from './hasAttributes';
import { PutReturnValues } from './put';
import { MCfg } from './Table';

export type UpdateReturnValues = 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' | PutReturnValues;

export type UpdateItemInput<PK extends DocumentClient.UpdateItemInput['Key'], RV extends UpdateReturnValues> = Assign<
	NoTN<DocumentClient.UpdateItemInput>,
	{ Key: PK; ReturnValues?: RV }
>;

export type UpdateItemOutput<A extends DocumentClient.AttributeMap, RV extends UpdateReturnValues> = Assign<
	DocumentClient.UpdateItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW' ? A : undefined;
	}
>;

export const updateFn =
	<PKey extends object>(config: MCfg) =>
	async <A extends PKey, RV extends UpdateReturnValues>(
		query: UpdateItemInput<PKey, RV>
	): Promise<UpdateItemOutput<A, RV>> => {
		const data = await config.client.update({ TableName: config.name, ...query }).promise();

		hasUpdateAttributes<A, RV>(data);

		if (config.logger) config.logger.info(data);

		return data;
	};
