import { PrimaryIndex, Table } from '../Table';
import { dxTableScan } from './scan';
import { dxTableBatchWrite } from './batchWrite';

export const dxTableReset = async <T extends Table = Table>(Table: T) => {
	const scanData = await dxTableScan(Table, undefined);

	if (scanData.items.length === 0) return;

	await dxTableBatchWrite(
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
