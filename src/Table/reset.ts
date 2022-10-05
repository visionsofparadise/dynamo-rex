import chunk from 'lodash/chunk';
import pick from 'lodash/pick';
import { Table, IdxATL, IdxCfgSet } from './Table';

export const resetFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async () => {
		const scanData = await Table.scan();

		if (scanData.Items) {
			const batches = chunk(scanData.Items);

			for (const batch of batches) {
				await Promise.all(
					batch.map(async Item => {
						const primaryIndex = Table.config.indexes[Table.config.primaryIndex];

						const hashKey = primaryIndex.hashKey.attribute;
						const rangeKey = primaryIndex.rangeKey ? primaryIndex.rangeKey.attribute : undefined;
						return Table.delete({
							Key: pick(Item, rangeKey ? [hashKey, rangeKey] : [hashKey])
						});
					})
				);
			}
		}

		return;
	};
