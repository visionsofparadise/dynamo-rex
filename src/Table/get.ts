import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { hasItem } from './hasItem';
import { IdxATL, IdxCfgM, IdxKey, IdxKeys, MCfg, NotPIdxN, TIdxN } from './Table';

export type GetItemInput<
	A extends DocumentClient.AttributeMap,
	Key extends DocumentClient.GetItemInput['Key']
> = Assign<NoTN<DocumentClient.GetItemInput>, { AttributesToGet?: Array<string & keyof A>; Key: Key }>;

export type GetItemOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.GetItemOutput,
	{
		Item: A;
	}
>;

export const getFn =
	<
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL>
	>(
		config: MCfg
	) =>
	async <
		A extends {},
		Idx extends NotPIdxN<TPIdxN, TIdxCfgM> | never = never,
		AIdxA extends DocumentClient.AttributeMap = A & IdxKeys<TPIdxN | Idx, TIdxCfgM>
	>(
		query: GetItemInput<A, IdxKey<TIdxCfgM[TPIdxN]>>
	): Promise<GetItemOutput<AIdxA>> => {
		const data = await config.client.get({ TableName: config.name, ...query }).promise();

		hasItem<AIdxA>(data);

		if (config.logger) config.logger.info(data.Item);

		return data;
	};
