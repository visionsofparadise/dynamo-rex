import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';

export type UpdateItemOutput<A extends DocumentClient.AttributeMap> = Omit<
	DocumentClient.UpdateItemOutput,
	'Attributes'
> & {
	Attributes?: A;
};

export const update =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query: Omit<DocumentClient.UpdateItemInput, 'TableName'>
	): Promise<UpdateItemOutput<A>> => {
		const data = await client.update({ TableName, ...query }).promise();

		if (logger) logger.info(data);

		const Attributes = data.Attributes as A;

		return {
			...data,
			Attributes
		};
	};
