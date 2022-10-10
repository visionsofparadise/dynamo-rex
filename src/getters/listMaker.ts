import { QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';
import { IdxATL, IdxCfgSet } from '../Table/Table';
import { itemizeFn } from './itemize';

export const listMakerFn =
	<
		Idx extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<Idx, TIdxCfg>
	>(
		Item: Item
	) =>
	async <A extends object>(data: QueryOutput<A>) => {
		const itemize = itemizeFn<Idx, TIdxCfg, Item>(Item);

		let Items: Array<InstanceType<Item>> = [];

		for (const Item of data.Items) {
			const newItem = await itemize(Item);

			Items.push(newItem);
		}

		return { ...data, Items };
	};
