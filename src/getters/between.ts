import { Table, IdxCfgM, IdxATL, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { QueryGetterCfg, GetterQueryInput, QueryIdxN } from './indexGetters';

export const betweenFn =
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
			Min: string | number;
			Max: string | number;
		}
	) => {
		const { hashKey, hashKeyValue, rangeKey, IndexName } = config;

		const { Min, Max, ...restOfQuery } = listQuery;

		return Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey AND ${rangeKey} BETWEEN :min AND :max`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue,
				[`:min`]: Min,
				[`:max`]: Max
			},
			...restOfQuery
		});
	};
