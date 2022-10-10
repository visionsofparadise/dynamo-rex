import { StaticItem } from '../Item/Item';
import { zipObject } from '../utils';
import { IdxACfg, IdxATL, IdxCfgSet, IdxKey } from '../Table/Table';
import { HKRKP } from './getters';

export const keyOfFn =
	<
		Idx extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<Idx, TIdxCfg>
	>(
		Item: Item,
		config: {
			hashKey: TIdxCfg[Idx]['hashKey']['attribute'];
			rangeKey: TIdxCfg[Idx]['rangeKey'] extends IdxACfg<string, IdxATL>
				? TIdxCfg[Idx]['rangeKey']['attribute']
				: undefined;
		}
	) =>
	(props: HKRKP<Idx, TIdxCfg, Item>): IdxKey<TIdxCfg[Idx]> => {
		const { hashKey, rangeKey } = config;

		const attributes = rangeKey ? [hashKey, rangeKey] : [hashKey];
		const values = attributes.map(attribute => Item[attribute](props));

		return zipObject(attributes, values);
	};
