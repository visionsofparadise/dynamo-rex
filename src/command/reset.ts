import { PrimaryIndex, Table } from '../Table';
import { dxScan } from './scan';
import { dxBatchWrite } from './batchWrite';

export const dxReset = async <T extends Table = Table>(Table: T) => {
	const scanData = await dxScan(Table, undefined);

	if (scanData.items.length === 0) return;

	await dxBatchWrite(
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
