import { IdxAFns } from '../Item/Item';
import { zipObject } from '../utils';
import { IdxCfgM, IdxKey, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { GetterCfg } from './indexGetters';

export const keyOfFn =
	<
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<IdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxCfgM extends IdxCfgM<TPIdxN>
	>(
		Item: IIdxAFns,
		config: GetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>
	) =>
	(props: HKRKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>): IdxKey<TIdxCfgM[IdxN]> => {
		const { hashKey, rangeKey } = config;

		const attributes = rangeKey ? [hashKey, rangeKey] : [hashKey];
		const values = attributes.map(attribute => Item[attribute](props));

		return zipObject(attributes, values);
	};
