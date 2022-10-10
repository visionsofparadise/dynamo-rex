import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { getFn, GetItemInput } from './get';
import { putFn, PutItemInput, PutItemOutput, PutReturnValues } from './put';
import { MCfg } from './Table';

export type CreateItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends PutReturnValues
> = PutItemInput<A, RV> & GetItemInput<A, PK>;

export const createFn =
	<PKey extends object>(config: MCfg) =>
	async <A extends PKey, RV extends PutReturnValues>(
		query: CreateItemInput<A, PKey, RV>
	): Promise<PutItemOutput<A, RV>> => {
		try {
			await getFn<PKey>(config)<A>(query);
		} catch (error) {
			return putFn<PKey>(config)<A, RV>(query);
		}

		throw new Error('Item already exists');
	};
