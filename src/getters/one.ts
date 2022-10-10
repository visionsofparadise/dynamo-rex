import { StaticItem } from '../Item/Item';
import { Table, IdxACfg, IdxATL, IdxCfgSet } from '../Table/Table';
import { HKRKP } from './getters';
import { itemizeFn } from './itemize';
import { keyOfFn } from './keyOf';

export const oneFn =
	<
		Idx extends ISIdx | TPIdxN,
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<Idx, TIdxCfg>
	>(
		Table: Table<string, IdxATL, TPIdxN, TIdxCfg>,
		Item: Item,
		config: {
			hashKey: TIdxCfg[Idx]['hashKey']['attribute'];
			rangeKey: TIdxCfg[Idx]['rangeKey'] extends IdxACfg<string, IdxATL>
				? TIdxCfg[Idx]['rangeKey']['attribute']
				: undefined;
			IndexName: Exclude<Idx, TPIdxN> | undefined;
		}
	) =>
	async (props: HKRKP<Idx, TIdxCfg, Item>): Promise<InstanceType<typeof Item>> => {
		const { hashKey, rangeKey, IndexName } = config;

		const key = keyOfFn<Idx, TIdxCfg, Item>(Item, config)(props);

		const itemize = itemizeFn<Idx, TIdxCfg, Item>(Item);

		return !IndexName
			? Table.get({ Key: key }).then(data => itemize(data.Item))
			: Table.query({
					IndexName,
					Limit: 1,
					KeyConditionExpression: `${hashKey} = :hashKey${rangeKey ? ` AND ${rangeKey} = :rangeKey` : ``}`,
					ExpressionAttributeValues: rangeKey
						? {
								[`:hashKey`]: key[hashKey],
								[`:rangeKey`]: key[rangeKey]
						  }
						: {
								[`:hashKey`]: key[hashKey]
						  }
			  }).then(async data => {
					const items: Array<InstanceType<typeof Item>> = await Promise.all(data.Items!.map(itemize));

					return items[0];
			  });
	};
