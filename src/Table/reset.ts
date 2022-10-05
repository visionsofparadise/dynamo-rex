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
		if (Table.config.logger) Table.config.logger.info(`Resetting ${Table.config.name}`);

		const scanData = await Table.scan();

		if (Table.config.logger) Table.config.logger.info(scanData);

		if (scanData.Items) {
			for (const item of scanData.Items) {
				const primaryIndex = Table.config.indexes[Table.config.primaryIndex];

				const hashKey = primaryIndex.hashKey.attribute;
				const rangeKey = primaryIndex.rangeKey ? primaryIndex.rangeKey.attribute : undefined;

				await Table.delete({
					Key: pick(item, rangeKey ? [hashKey, rangeKey] : [hashKey])
				});
			}
		}

		return;
	};
