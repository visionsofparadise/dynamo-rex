import { IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN, Table } from '../Table/Table';
import { QueryA, QueryOutput } from '../Table/query';
import { GetterQueryInput } from './getters';
import { QueryGetterCfg } from './indexGetters';

export const hashKeyOnlyFn =
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
		listQuery?: GetterQueryInput<TPIdxN, Exclude<IdxN, TPIdxN>, TIdxP, TIdxPA, TIdxCfgM>
	): Promise<QueryOutput<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>>> => {
		const { hashKey, hashKeyValue, IndexName } = config;

		return Table.query<IA, Exclude<IdxN, TPIdxN>>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue
			},
			...(listQuery || {})
		});
	};
