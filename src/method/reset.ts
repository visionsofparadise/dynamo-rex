import { PrimaryIndex, Table } from '../Table';
import { scanTableItems } from './scan';
import { batchWriteTableItems } from './batchWrite';

export const resetTableItems = async <T extends Table = Table>(Table: T) => {
	const scanData = await scanTableItems(Table, undefined);

	if (scanData.items.length === 0) return;

	await batchWriteTableItems(
		Table,
		scanData.items.map(item => {
			if (!Table.config.indexes.primaryIndex.sort) {
				return {
					delete: {
						[Table.config.indexes.primaryIndex.hash.key]: item[Table.config.indexes.primaryIndex.hash.key]
					} as T['IndexKeyMap'][PrimaryIndex]
				};
			}

			return {
				delete: {
					[Table.config.indexes.primaryIndex.hash.key]: item[Table.config.indexes.primaryIndex.hash.key],
					[Table.config.indexes.primaryIndex.sort.key]: item[Table.config.indexes.primaryIndex.sort.key]
				} as T['IndexKeyMap'][PrimaryIndex]
			};
		}),
		undefined
	);

	return;
};
