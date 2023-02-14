import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Assign, NoTN } from '../utils';
import { assertItems } from './assertItem';
import { IdxATL, MCfg, IdxCfgM, IdxCfgMToKeyM, NotPIdxN, TIdxN, IdxKeys } from './Table';

export type QueryInput<
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL>
> = Assign<
	NoTN<DocumentClient.QueryInput>,
	{
		IndexName?: IdxN;
		ExclusiveStartKey?: IdxCfgMToKeyM<TIdxCfgM>[TPIdxN] &
			(IdxN extends NotPIdxN<TPIdxN, TIdxCfgM> ? IdxCfgMToKeyM<TIdxCfgM>[IdxN] : {});
	}
>;

export type QueryOutput<
	A extends DocumentClient.AttributeMap,
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Assign<
	DocumentClient.QueryOutput,
	{
		Items: Array<
			(ProjectAttributes<A, IdxN, TPIdxN, TIdxCfgM> extends never ? A : ProjectAttributes<A, IdxN, TPIdxN, TIdxCfgM>) &
				IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>
		>;
	}
>;

export type ProjectAttributes<
	A extends DocumentClient.AttributeMap,
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>
	? TIdxCfgM[IdxN]['project'] extends string[]
		? { [x in TIdxCfgM[IdxN]['project'][number] & keyof A]: x extends keyof A ? A[x] : never }
		: TIdxCfgM[IdxN]['project'] extends never[]
		? {}
		: TIdxCfgM[IdxN]['project'] extends never
		? A
		: A
	: A;

export const queryFn =
	<TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL>>(config: MCfg) =>
	async <
		A extends DocumentClient.AttributeMap,
		IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>
	>(
		query: QueryInput<IdxN, TPIdxN, TIdxCfgM>
	): Promise<QueryOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>> => {
		const data = await config.client
			.query({ TableName: config.name, ...query, IndexName: query.IndexName && String(query.IndexName) })
			.promise();

		if (config.logger) config.logger.info(data);

		assertItems<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>(data);

		return data;
	};
