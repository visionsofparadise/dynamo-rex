import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';
import { get } from './get';

export type DeleteItemOutput<A extends DocumentClient.AttributeMap> = Omit<
	DocumentClient.DeleteItemOutput,
	'Attributes'
> & {
	Attributes?: A;
};

export const _delete =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query: Omit<DocumentClient.DeleteItemInput, 'TableName'>
	): Promise<DeleteItemOutput<A>> => {
		await get(client, TableName, logger)(query);

		const data = await client.delete({ TableName, ...query }).promise();

		const Attributes = data.Attributes as A;

		return {
			...data,
			Attributes
		};
	};
