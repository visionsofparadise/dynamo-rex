import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';

export type PutItemOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.PutItemOutput, 'Attributes'> & {
	Attributes?: A;
};

export const put =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query: Omit<DocumentClient.PutItemInput, 'TableName'>
	): Promise<PutItemOutput<A>> => {
		const data = await client.put({ TableName, ...query }).promise();

		if (logger) logger.info(data);

		const Attributes = data.Attributes as A;

		return {
			...data,
			Attributes
		};
	};
