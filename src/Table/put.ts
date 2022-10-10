import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasPutAttributes } from './hasAttributes';
import { MCfg } from './Table';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Assign<
	NoTN<DocumentClient.PutItemInput>,
	{
		Item: A;
		ReturnValues?: RV;
	}
>;

export type PutItemOutput<A extends DocumentClient.AttributeMap, RV extends PutReturnValues> = Assign<
	DocumentClient.PutItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A : undefined;
	}
>;

export const putFn =
	<PKey extends object>(config: MCfg) =>
	async <A extends PKey, RV extends PutReturnValues>(query: PutItemInput<A, RV>): Promise<PutItemOutput<A, RV>> => {
		const data = await config.client.put({ TableName: config.name, ...query }).promise();

		if (config.logger) config.logger.info(data);

		hasPutAttributes<A, RV>(data, query.ReturnValues);

		return data;
	};
