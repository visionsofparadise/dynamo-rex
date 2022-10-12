import { QueryA, QueryOutput } from '../Table/query';
import { Table, IdxCfgM, IdxATL, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { GetterQueryInput } from './getters';
import { QueryGetterCfg } from './indexGetters';

export const startsWithFn =
	<
		IdxN extends ISIdxN | TPIdxN,
		IA extends {},
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		config: QueryGetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		listQuery: GetterQueryInput<TPIdxN, Exclude<IdxN, TPIdxN>, TIdxP, TIdxPA, TIdxCfgM> & {
			StartsWith: string | number;
		}
	): Promise<QueryOutput<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>>> => {
		const { hashKey, hashKeyValue, rangeKey, IndexName } = config;

		const { StartsWith, ...restOfQuery } = listQuery;

		return Table.query<IA, Exclude<IdxN, TPIdxN>>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey AND begins_with(${rangeKey}, :startsWith)`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue,
				[`:startsWith`]: StartsWith
			},
			...restOfQuery
		});
	};
