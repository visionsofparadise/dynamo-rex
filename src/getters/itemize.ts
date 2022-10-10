import { IdxATL, IdxCfgSet } from '../Table/Table';
import { StaticItem } from '../Item/Item';

export const itemizeFn =
	<
		Idx extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<Idx, TIdxCfg>
	>(
		Item: Item
	) =>
	async (data: unknown): Promise<InstanceType<typeof Item>> =>
		new Item(data);
