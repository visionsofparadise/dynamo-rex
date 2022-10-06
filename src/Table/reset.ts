import { chunk } from 'lodash';
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

		if (scanData.Items) {
			const batches = chunk(scanData.Items, 25);

			for (const batch of batches) {
				const primaryIndex = ParentTable.config.indexes[ParentTable.config.primaryIndex];

				const hashKey = primaryIndex.hashKey.attribute;
				const rangeKey = primaryIndex.rangeKey ? primaryIndex.rangeKey.attribute : undefined;

				await ParentTable.config.client
					.batchWrite({
						RequestItems: {
							[ParentTable.config.name]: batch.map(item => ({
								DeleteRequest: {
									Key: pick(item, rangeKey ? [hashKey, rangeKey] : [hashKey])
								}
							}))
						}
					})
					.promise();
			}
		}

		return;
	};
