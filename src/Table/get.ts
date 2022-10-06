import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTableName } from '../utils';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type GetItemInput<A extends DocumentClient.AttributeMap, PK extends DocumentClient.GetItemInput['Key']> = Assign<
	NoTableName<DocumentClient.GetItemInput>,
	{ AttributesToGet?: Array<string & keyof A>; Key: PK }
>;

export type GetItemOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.GetItemOutput,
	{
		Item: A;
	}
>;

export const getFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>>(
		query: GetItemInput<A, IdxKey<TIdxCfg[TPIdxN]>>
	): Promise<GetItemOutput<A>> => {
		const data = await ParentTable.config.client.get({ TableName: ParentTable.config.name, ...query }).promise();

		ParentTable.hasItem<A>(data);

		if (ParentTable.config.logger) ParentTable.config.logger.info(data.Item);

		return data;
	};
