import { Table, IdxCfgM, IdxATL, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { QueryGetterCfg, GetterQueryInput, QueryIdxN } from './indexGetters';

export const startsWithFn =
	<
		IA extends {},
		IdxN extends TPIdxN | ISIdxN,
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
		listQuery: GetterQueryInput<QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM> & {
			StartsWith: string | number;
		}
	) => {
		const { hashKey, hashKeyValue, rangeKey, IndexName } = config;

		const { StartsWith, ...restOfQuery } = listQuery;

		return Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey AND begins_with(${rangeKey}, :startsWith)`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue,
				[`:startsWith`]: StartsWith
			},
			...restOfQuery
		});
	};
