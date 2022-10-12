import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTN } from '../utils';
import { hasItems } from './hasItem';
import { IdxATL, MCfg, IdxCfgM, IdxCfgMToKeyM, IdxP, NotPIdxN, TIdxN } from './Table';

export type QueryInput<
	TPIdxN extends TIdxN<TIdxCfgM>,
	TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
> = Assign<
	NoTN<DocumentClient.QueryInput>,
	{
		IndexName?: TSIdxN;
		ExclusiveStartKey?: IdxCfgMToKeyM<TIdxCfgM>[TPIdxN] &
			(TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> ? IdxCfgMToKeyM<TIdxCfgM>[TSIdxN] : {});
	}
>;

export type QueryOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.QueryOutput,
	{
		Items: Array<A>;
	}
>;

export type QueryA<
	A extends DocumentClient.AttributeMap,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	TIdxKeyM extends IdxCfgMToKeyM<TIdxCfgM> = IdxCfgMToKeyM<TIdxCfgM>
> = TIdxKeyM[TPIdxN] &
	(TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>
		? TIdxKeyM[TSIdxN] &
				(TIdxCfgM[TSIdxN]['project'] extends string[]
					? { [x in TIdxCfgM[TSIdxN]['project'][number] & keyof A]: x extends keyof A ? A[x] : never }
					: TIdxP extends never[]
					? never
					: A)
		: A);

export const queryFn =
	<
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		config: MCfg
	) =>
	async <A extends DocumentClient.AttributeMap, TSIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never>(
		query: QueryInput<TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>
	): Promise<QueryOutput<QueryA<A, TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>>> => {
		const data = await config.client
			.query({ TableName: config.name, ...query, IndexName: query.IndexName && String(query.IndexName) })
			.promise();

		if (config.logger) config.logger.info(data);

		hasItems<QueryA<A, TPIdxN, TSIdxN, TIdxPA, TIdxP, TIdxCfgM>>(data);

		return data;
	};
