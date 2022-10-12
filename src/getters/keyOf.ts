import { IdxAFns } from '../Item/Item';
import { zipObject } from '../utils';
import { IdxCfgM, IdxKey, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { GetterCfg } from './indexGetters';

export const keyOfFn =
	<
		IdxN extends string & keyof TIdxCfgM,
		IIdxAFns extends IdxAFns<IdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxCfgM extends IdxCfgM<TPIdxN>
	>(
		Item: IIdxAFns,
		config: GetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	(props: HKRKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>): IdxKey<TIdxCfgM[IdxN]> => {
		const { hashKey, rangeKey } = config;

		const attributes = rangeKey ? [hashKey, rangeKey] : [hashKey];
		const values = attributes.map(attribute => Item[attribute](props));

		return zipObject(attributes, values);
	};
