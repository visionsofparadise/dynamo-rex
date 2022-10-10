import { StaticItem } from '../Item/Item';
import { Table, IdxCfgSet, IdxATL, IdxACfg } from '../Table/Table';
import { HKP } from './getters';
import { allFn } from './all';
import { keyOfFn } from './keyOf';
import { oneFn } from './one';
import { hashKeyOnlyFn } from './hashKeyOnly';
import { startsWithFn } from './startsWith';
import { betweenFn } from './between';

export const indexGettersFn =
	<
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>,
		Item extends StaticItem<TPIdxN | ISIdx, TIdxCfg>
	>(
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>,
		Item: Item
	) =>
	<Idx extends TPIdxN | ISIdx>(
		index: Idx
	): {
		keyOf: ReturnType<typeof keyOfFn<Idx, TIdxCfg, Item>>;
		one: ReturnType<typeof oneFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>>;
		all: ReturnType<typeof allFn<ISIdx, TPIdxN, TIdxCfg, Item>>;
		query: (props: HKP<Idx, TIdxCfg, Item>) => {
			hashKeyOnly: ReturnType<typeof hashKeyOnlyFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>>;
			startsWith: ReturnType<typeof startsWithFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>>;
			between: ReturnType<typeof betweenFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>>;
		};
	} => {
		const Index = Table.config.indexes[index];

		const hashKey = Index.hashKey.attribute;
		const rangeKey = Index.rangeKey ? Index.rangeKey.attribute : undefined;
		const IndexName = index === (Table.config.primaryIndex as string) ? undefined : (index as Exclude<Idx, TPIdxN>);

		const config = {
			hashKey,
			rangeKey: rangeKey as TIdxCfg[Idx]['rangeKey'] extends IdxACfg<string, IdxATL>
				? TIdxCfg[Idx]['rangeKey']['attribute']
				: undefined,
			IndexName
		};

		const query = (props: HKP<Idx, TIdxCfg, Item>) => {
			const queryConfig = {
				...config,
				hashKeyValue: Item[hashKey](props)
			};

			return {
				hashKeyOnly: hashKeyOnlyFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>(Table, Item, queryConfig),
				startsWith: startsWithFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>(Table, Item, queryConfig),
				between: betweenFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>(Table, Item, queryConfig)
			};
		};

		return {
			keyOf: keyOfFn<Idx, TIdxCfg, Item>(Item, config),
			one: oneFn<Idx, ISIdx, TPIdxN, TIdxCfg, Item>(Table, Item, config),
			all: allFn<ISIdx, TPIdxN, TIdxCfg, Item>(),
			query
		};
	};
