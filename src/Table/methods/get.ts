import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export type GetItemInput<A extends DocumentClient.AttributeMap, PK extends DocumentClient.GetItemInput['Key']> = Omit<
	DocumentClient.GetItemInput,
	'TableName' | 'AttributesToGet' | 'Key'
> & { AttributesToGet?: Array<string & keyof A>; Key: PK };

export type GetItemOutput<A extends DocumentClient.AttributeMap> = Omit<DocumentClient.GetItemOutput, 'Item'> & {
	Item: A;
};

export const get =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap>(
		query: GetItemInput<A, IdxCfg[TPIdxN]['key']>
	): Promise<GetItemOutput<A>> => {
		const data = await Table.tableConfig.client.get({ TableName: Table.tableConfig.name, ...query }).promise();

		if (!data || !data.Item || (typeof data === 'object' && Object.keys(data).length === 0)) {
			throw new Error('Item Not Found');
		}

		if (Table.tableConfig.logger) Table.tableConfig.logger.info(data.Item);

		return {
			...data,
			Item: data.Item as A
		};
	};
