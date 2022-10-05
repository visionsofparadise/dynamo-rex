import chunk from 'lodash/chunk';
import { QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';
import { IdxATL, IdxCfgSet } from '../Table/Table';
import { itemizeFn } from './itemize';

export const listMakerFn =
	<
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>,
		Item extends StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	>(
		Item: Item
	) =>
	async <A extends object>(data: QueryOutput<A>) => {
		const itemize = itemizeFn<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg, Item>(Item);

		const batches = chunk(data.Items, 10);

		let items: Array<InstanceType<Item>> = [];

		for (const batch of batches) {
			const newItems = await Promise.all(batch.map(itemize));

			items = [...items, ...newItems];
		}

		return {
			...data,
			Items: items
		};
	};
