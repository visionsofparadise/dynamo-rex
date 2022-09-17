import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';
import { get } from './get';
import { put } from './put';

export const create =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <Data extends DocumentClient.AttributeMap>(
		Key: DocumentClient.Key,
		query: Omit<DocumentClient.PutItemInput, 'TableName'>
	) => {
		try {
			await get(client, TableName, logger)<Data>({ Key });
		} catch (error) {
			return put(client, TableName, logger)<Data>(query);
		}

		throw new Error('Item already exists');
	};
