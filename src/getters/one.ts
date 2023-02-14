import { assertItems } from '../Table/assertItem';
import { IdxAFns } from '../Item/Item';
import { Table, IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { keyOfFn } from './keyOf';
import { GetterCfg, QueryIdxN } from './indexGetters';
export const oneFn =
	<
		IA extends {},
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<TIdxCfgM[IdxN]>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns,
		config: GetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	async (data: HKRKP<IIdxAFns, TIdxCfgM[IdxN]>) => {
		const { hashKey, rangeKey, IndexName } = config;

		const keyOf = keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);
		const Key = keyOf(data);

		return !IndexName
			? Table.get<IA, ISIdxN>({ Key }).then(data => data.Item)
			: Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
					IndexName,
					Limit: 1,
					KeyConditionExpression: `${hashKey} = :hashKey${rangeKey ? ` AND ${rangeKey} = :rangeKey` : ``}`,
					ExpressionAttributeValues: rangeKey
						? {
								[`:hashKey`]: Key[hashKey],
								[`:rangeKey`]: Key[rangeKey]
						  }
						: {
								[`:hashKey`]: Key[hashKey]
						  }
			  }).then(data => {
					assertItems<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>(data);

					return data.Items[0];
			  });
	};
