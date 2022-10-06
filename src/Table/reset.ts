import pick from 'lodash/pick';
import { Table, IdxATL, IdxCfgSet } from './Table';

export const resetFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async () => {
		if (ParentTable.config.logger) ParentTable.config.logger.info(`Resetting ${ParentTable.config.name}`);

		const scanData = await ParentTable.scan();

		if (ParentTable.config.logger) ParentTable.config.logger.info(scanData);

		if (scanData.Items) {
			for (const item of scanData.Items) {
				const primaryIndex = ParentTable.config.indexes[ParentTable.config.primaryIndex];

				const hashKey = primaryIndex.hashKey.attribute;
				const rangeKey = primaryIndex.rangeKey ? primaryIndex.rangeKey.attribute : undefined;

				await ParentTable.delete({
					Key: pick(item, rangeKey ? [hashKey, rangeKey] : [hashKey])
				});
			}
		}

		return;
	};
