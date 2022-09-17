import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';

export type GetItemOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.GetItemOutput, 'Item'> & {
	Item: A;
};

export const get =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query: Omit<DocumentClient.GetItemInput, 'TableName'>
	): Promise<GetItemOutput<A>> => {
		const data = await client.get({ TableName, ...query }).promise();

		if (!data || !data.Item || (typeof data === 'object' && Object.keys(data).length === 0)) {
			throw new Error('Item Not Found');
		}

		if (logger) logger.info(data.Item);

		const Item = data.Item as A;

		return {
			...data,
			Item
		};
	};
