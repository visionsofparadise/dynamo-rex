import { IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN, Table } from '../Table/Table';
import { QueryGetterCfg, GetterQueryInput, QueryIdxN } from './indexGetters';

export const hashKeyOnlyFn =
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
	async (listQuery?: GetterQueryInput<QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM>) => {
		const { hashKey, hashKeyValue, IndexName } = config;

		return Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue
			},
			...(listQuery || {})
		});
	};
