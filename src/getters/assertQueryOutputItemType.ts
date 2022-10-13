import { Item } from '../Item/Item';
import { Table, NotPIdxN, TIdxN, IdxP, IdxCfgM, IdxATL } from '../Table/Table';
import { Constructor } from '../utils';
import { GetterCfg, GetterQueryOutput, QueryGetterCfg, QueryIdxN } from './indexGetters';
import { GetterOneOutput } from './one';

export const assertQueryOutputItemType: <
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
>(
	output: {},
	isItems: boolean,
	config: QueryGetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>,
	Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>
) => asserts output is GetterQueryOutput<
	IA,
	QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>,
	ISIdxN,
	TPIdxN,
	TIdxPA,
	TIdxP,
	TIdxCfgM,
	GItem
> = (output, isItems, config, Table) => {
	if (Table.config.indexes[config.index].project && isItems && output) {
		throw new Error('Failed to return item data');
	}

	if (!Table.config.indexes[config.index].project && !isItems && output) {
		throw new Error('Failed to return item data');
	}
};

export const assertOneOutputItemType: <
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
>(
	output: {},
	isItem: boolean,
	config: GetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>,
	Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>
) => asserts output is GetterOneOutput<
	IA,
	QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>,
	ISIdxN,
	TPIdxN,
	TIdxPA,
	TIdxP,
	TIdxCfgM,
	GItem
> = (output, isItem, config, Table) => {
	if (Table.config.indexes[config.index].project && isItem && output) {
		throw new Error('Failed to return item data');
	}

	if (!Table.config.indexes[config.index].project && !isItem && output) {
		throw new Error('Failed to return item data');
	}
};
