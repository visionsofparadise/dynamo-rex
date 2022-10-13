import { assertItems } from '../Table/assertItem';
import { IdxAFns, Item } from '../Item/Item';
import { Table, IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { keyOfFn } from './keyOf';
import { GetterCfg, GetterQueryOutput, QueryIdxN } from './indexGetters';
import { Constructor } from '../utils';
import { assertOneOutputItemType } from './assertQueryOutputItemType';

export type GetterOneOutput<
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
> = GetterQueryOutput<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>['Items'][number];

export const oneFn =
	<
		IA extends {},
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<IdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
		GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns & GItem,
		config: GetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		props: HKRKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>
	): Promise<
		GetterOneOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>
	> => {
		const { hashKey, rangeKey, IndexName } = config;

		const keyOf = keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);
		const Key = keyOf(props);

		const output = !IndexName
			? await Table.get<IA, ISIdxN>({ Key }).then(data => data.Item)
			: await Table.query<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
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
					assertItems<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>(data);

					return data.Items[0];
			  });

		const item = Table.config.indexes[config.index].project ? output : new Item(output);
		const isItem = Table.config.indexes[config.index].project ? false : true;

		assertOneOutputItemType<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>(item, isItem, config, Table);

		return item;
	};
