import { IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN, Table } from '../Table/Table';
import { QueryOutput } from '../Table/query';
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
		config: QueryGetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		listQuery?: GetterQueryInput<QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM>
	): Promise<QueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>> => {
		const { hashKey, hashKeyValue, IndexName } = config;

		return Table.query<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue
			},
			...(listQuery || {})
		});
	};
