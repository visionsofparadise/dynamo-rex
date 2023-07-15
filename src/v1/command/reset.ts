import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import { chunk } from '../util/utils';
import { dxScan } from './scan';

export const dxReset = async <T extends Table = Table>(Table: T) => {
	const scanData = await dxScan(Table);

	const batches = chunk(scanData.items, 25);

	for (const batch of batches) {
		await Table.client.send(
			new BatchWriteCommand({
				RequestItems: {
					[Table.config.name]: batch.map(item => {
						if (!Table.config.indexes.primaryIndex.sort) {
							const { [Table.config.indexes.primaryIndex.hash.key]: hashValue } = item;

							return {
								DeleteRequest: {
									Key: {
										[Table.config.indexes.primaryIndex.hash.key]: hashValue
									}
								}
							};
						}

						const {
							[Table.config.indexes.primaryIndex.hash.key]: hashValue,
							[Table.config.indexes.primaryIndex.sort.key]: sortValue
						} = item;

						return {
							DeleteRequest: {
								Key: {
									[Table.config.indexes.primaryIndex.hash.key]: hashValue,
									[Table.config.indexes.primaryIndex.sort.key]: sortValue
								}
							}
						};
					})
				}
			})
		);
	}

	return;
};
