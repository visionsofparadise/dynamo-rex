import { Table, IdxCfgSet, IdxATL, IdxACfg } from '../Table/Table';
import { zipObject } from '../utils';
import { StaticItem } from '../Item/Item';
import { indexGettersFn } from './indexGetters';

export type HKP<
	Idx extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<string, IdxATL>,
	Item extends StaticItem<Idx, TIdxCfg>,
	HKPT = Parameters<Item[TIdxCfg[Idx]['hashKey']['attribute']]>[0]
> = HKPT extends undefined ? void : HKPT;

export type RKP<
	Idx extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<string, IdxATL>,
	Item extends StaticItem<Idx, TIdxCfg>,
	RKCfg = TIdxCfg[Idx]['rangeKey']
> = RKCfg extends IdxACfg<string, IdxATL>
	? Parameters<Item[RKCfg['attribute']]>[0] extends undefined
		? void
		: Parameters<Item[RKCfg['attribute']]>[0]
	: void;

export type HKRKP<
	Idx extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<string, IdxATL>,
	Item extends StaticItem<Idx, TIdxCfg>,
	HKPT = HKP<Idx, TIdxCfg, Item>,
	RKPT = RKP<Idx, TIdxCfg, Item>
> = HKPT extends void ? (RKPT extends void ? void : RKPT) : RKPT extends void ? HKPT : HKPT & RKPT;

export const getters =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	<ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>, Item extends StaticItem<ISIdx | TPIdxN, TIdxCfg>>(
		Item: Item & {
			secondaryIndexes: Array<ISIdx>;
		}
	) => {
		const indexGetters = indexGettersFn<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg, Item>(Table, Item);

		const indexFunctionSet: { [x in ISIdx]: ReturnType<typeof indexGetters<x>> } = zipObject(
			Item.secondaryIndexes,
			Item.secondaryIndexes.map(index => indexGetters(index))
		);

		const primaryOne = indexGetters(Table.config.primaryIndex).one;

		const gettersObject = Object.assign(primaryOne, {
			...indexGetters(Table.config.primaryIndex),
			...indexFunctionSet
		});

		return gettersObject;
	};
