import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';

export type QueryOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.QueryOutput, 'Items'> & {
	Items: Array<A>;
};

export const query =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query: Omit<DocumentClient.QueryInput, 'TableName'>
	): Promise<QueryOutput<A>> => {
		const data = await client.query({ TableName, ...query }).promise();

		if (logger) logger.info(data);

		return {
			...data,
			Items: (data.Items || []) as Array<A>
		};
	};
