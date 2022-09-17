import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';

export type ScanOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.ScanOutput, 'Items'> & {
	Items?: Array<A>;
};

export const scan =
	(client: DocumentClient, TableName: string, logger?: ILogger) =>
	async <A extends DocumentClient.AttributeMap>(
		query?: Omit<DocumentClient.ScanInput, 'TableName'>
	): Promise<ScanOutput<A>> => {
		const data = await client.scan({ TableName, ...query }).promise();

		if (logger) logger.info(data);

		return {
			...data,
			Items: (data.Items || []) as Array<A>
		};
	};
