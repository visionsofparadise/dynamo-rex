import { IdxATL, IdxCfgSet } from '../Table/Table';
import { StaticItem } from '../Item/Item';

export const itemizeFn =
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
	async (data: unknown): Promise<InstanceType<Item>> => {
		const item = new Item(data);

		await item.onGet();

		return item;
	};
