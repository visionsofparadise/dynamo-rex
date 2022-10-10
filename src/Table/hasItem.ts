import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemOutput } from './get';
import { QueryOutput } from './query';
import { ScanOutput } from './scan';

export const hasItem: <A extends object>(
	data: DocumentClient.GetItemOutput
) => asserts data is GetItemOutput<A> = data => {
	if (!data || !data.Item || typeof data.Item !== 'object' || Object.keys(data.Item).length === 0) {
		throw new Error('Item not found');
	}
};

export const hasItems: <A extends object>(
	data: DocumentClient.QueryOutput | DocumentClient.ScanOutput
) => asserts data is QueryOutput<A> & ScanOutput<A> = data => {
	if (!data || !data.Items || typeof data.Items !== 'object') {
		throw new Error('Items not found');
	}
};
