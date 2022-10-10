import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasItem } from './hasItem';
import { MCfg } from './Table';

export type GetItemInput<A extends DocumentClient.AttributeMap, PK extends DocumentClient.GetItemInput['Key']> = Assign<
	NoTN<DocumentClient.GetItemInput>,
	{ AttributesToGet?: Array<string & keyof A>; Key: PK }
>;

export type GetItemOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.GetItemOutput,
	{
		Item: A;
	}
>;

export const getFn =
	<PKey extends object>(config: MCfg) =>
	async <A extends PKey>(query: GetItemInput<A, PKey>): Promise<GetItemOutput<A>> => {
		const data = await config.client.get({ TableName: config.name, ...query }).promise();

		hasItem<A>(data);

		if (config.logger) config.logger.info(data.Item);

		return data;
	};
