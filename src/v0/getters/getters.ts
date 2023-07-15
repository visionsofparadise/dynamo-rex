import { Table, IdxCfgM, IdxATL, IdxACfg, IdxP, NotPIdxN, TIdxN, PIdxCfg } from '../Table/Table';
import { Constructor, zipObject } from '../utils';
import { IdxAFns, ISIdxCfg, Item } from '../Item/Item';
import { indexGettersFn } from './indexGetters';
import { all } from './all';

export type KP<
	K extends keyof TIdxCfg,
	IIdxAFns extends IdxAFns<TIdxCfg>,
	TIdxCfg extends PIdxCfg,
	RKCfg = TIdxCfg[K]
> = RKCfg extends IdxACfg
	? Parameters<IIdxAFns[RKCfg['attribute']]>[0] extends undefined
		? void
		: Parameters<IIdxAFns[RKCfg['attribute']]>[0]
	: void;

export type HKRKP<
	IIdxAFns extends IdxAFns<TIdxCfg>,
	TIdxCfg extends PIdxCfg,
	HKPT = KP<'hashKey', IIdxAFns, TIdxCfg>,
	RKPT = KP<'rangeKey', IIdxAFns, TIdxCfg>
> = HKPT extends void ? (RKPT extends void ? void : RKPT) : RKPT extends void ? HKPT : HKPT & RKPT;

export const getters =
	<
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>
	) =>
	<IA extends {}, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>, IIdxAFns extends IdxAFns<TIdxCfgM[TPIdxN | ISIdxN]>>(
		Item: IIdxAFns & ISIdxCfg<ISIdxN> & Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	) => {
		const indexGetters = indexGettersFn<
			IA,
			ISIdxN,
			IIdxAFns,
			TPIdxN,
			TIdxA,
			TIdxATL,
			TIdxPA,
			TIdxP,
			TIdxCfgM,
			typeof Item
		>(Table, Item);

		const primaryOneGetter = indexGetters(Table.config.primaryIndex).one;

		const primaryIndexGetters = indexGetters(Table.config.primaryIndex);

		const secondaryIndexGetters: { [x in ISIdxN]: ReturnType<typeof indexGetters<x>> } = zipObject(
			Item.secondaryIndexes,
			Item.secondaryIndexes.map(index => indexGetters(index))
		);

		const gettersObject = Object.assign(primaryOneGetter, {
			all,
			...primaryIndexGetters,
			...secondaryIndexGetters
		});

		return gettersObject;
	};
