import { chunk } from '../utils';
import { scanFn } from './scan';
import { MCfg, PIdxCfg, IdxKey } from './Table';

export const resetFn =
	<TPIdxCfg extends PIdxCfg>(config: MCfg, primaryIndexConfig: TPIdxCfg) =>
	async () => {
		if (config.logger) config.logger.info(`Resetting ${config.name}`);

		const scanData = await scanFn(config)<IdxKey<TPIdxCfg>>();

		const hashKey = primaryIndexConfig.hashKey.attribute;
		const rangeKey = primaryIndexConfig.rangeKey ? primaryIndexConfig.rangeKey.attribute : undefined;

		const batches = chunk(scanData.Items, 25);

		for (const batch of batches) {
			await config.client
				.batchWrite({
					RequestItems: {
						[config.name]: batch.map(item => ({
							DeleteRequest: {
								Key: rangeKey
									? {
											[hashKey]: item[hashKey],
											[rangeKey]: item[rangeKey]
									  }
									: {
											[hashKey]: item[hashKey]
									  }
							}
						}))
					}
				})
				.promise();
		}

		return;
	};
