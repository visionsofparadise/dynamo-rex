import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasItem } from './hasItem';
import { IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type GetItemInput<Key extends DocumentClient.GetItemInput['Key']> = Assign<
	NoTN<DocumentClient.GetItemInput>,
	{ Key: Key }
>;

export type GetItemOutput<
	A extends DocumentClient.AttributeMap,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	DocumentClient.GetItemOutput,
	{
		Item: A & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>;
	}
>;

export const getFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN>>(config: MCfg) =>
	async <A extends DocumentClient.AttributeMap, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never>(
		query: GetItemInput<IdxKey<TIdxCfgM[TPIdxN]>>
	): Promise<GetItemOutput<A, ISIdxN, TPIdxN, TIdxCfgM>> => {
		const data = await config.client.get({ TableName: config.name, ...query }).promise();

		hasItem<A, ISIdxN, TPIdxN, TIdxCfgM>(data);

		if (config.logger) config.logger.info(data.Item);

		return data;
	};
