import { chunk } from '../utils';
import { scanFn } from './scan';
import { IdxATL, MCfg, IdxCfg, IdxKey } from './Table';

interface ResetCfg extends MCfg {
	hashKey: string;
	rangeKey: string | undefined;
}

export const resetFn =
	<
		TPIdxN extends string & keyof IdxKeyMap,
		IdxKeyMap extends Record<string, IdxKey<IdxCfg<string, string, IdxATL, IdxATL>>>
	>(
		config: ResetCfg
	) =>
	async () => {
		if (config.logger) config.logger.info(`Resetting ${config.name}`);

		const scanData = await scanFn<TPIdxN, IdxKeyMap>(config)();

		const { hashKey, rangeKey } = config;

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
