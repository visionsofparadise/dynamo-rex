import { IdxAFns } from '../Item/Item';
import { zipObject } from '../utils';
import { IdxCfgM, IdxKey, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { GetterCfg } from './indexGetters';

export const keyOfFn =
	<
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<TIdxCfgM[IdxN]>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxCfgM extends IdxCfgM<TPIdxN>
	>(
		Item: IIdxAFns,
		config: GetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	(props: HKRKP<IIdxAFns, TIdxCfgM[IdxN]>): IdxKey<TIdxCfgM[IdxN]> => {
		const { hashKey, rangeKey } = config;

		const attributes = rangeKey ? [hashKey, rangeKey] : [hashKey];
		const values = attributes.map(attribute => Item[attribute](props));

		return zipObject(attributes, values);
	};
