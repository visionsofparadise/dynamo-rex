import _chunk from 'lodash/chunk';
import _pick from 'lodash/pick';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ILogger } from '../../utils';
import { _delete } from './delete';
import { scan } from './scan';

export const reset =
	(client: DocumentClient, TableName: string, hashKey: PropertyKey, rangeKey: PropertyKey, logger?: ILogger) =>
	async () => {
		const scanData = await scan(client, TableName, logger)();

		if (scanData.Items) {
			const batches = _chunk(scanData.Items);

			for (const batch of batches) {
				await Promise.all(
					batch.map(async Item =>
						_delete(
							client,
							TableName,
							logger
						)({
							Key: _pick(Item, [hashKey, rangeKey])
						})
					)
				);
			}
		}

		return;
	};
