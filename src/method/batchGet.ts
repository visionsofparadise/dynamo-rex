import { KeysAndAttributes } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { LowerCaseObjectKeys } from '../util/keyCapitalize';
import { DkBatchGetCommand, DkBatchGetCommandInput } from '../command/BatchGet';
import { AnyKeySpace } from '../KeySpace';
import { DkClient } from '../Client';

export interface BatchGetItemsInput
	extends Omit<DkBatchGetCommandInput, 'RequestItems'>,
		LowerCaseObjectKeys<Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'>> {
	pageLimit?: number;
}

export interface BatchGetItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> {
	items: Array<Attributes>;
	unprocessedRequests: LowerCaseObjectKeys<Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'>> & { keys: Array<Key> };
}

export const batchGetTableItems = async <T extends Table = Table>(
	Table: T,
	keys: Array<T['IndexKeyMap'][T['PrimaryIndex']]>,
	input?: BatchGetItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<BatchGetItemsOutput<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
	const { pageLimit = 100, returnConsumedCapacity, ...rest } = input || ({} as BatchGetItemsInput);

	if (keys.length === 0)
		return {
			items: [],
			unprocessedRequests: {
				keys: [],
				...rest
			}
		};

	const limitedPageLimit = Math.min(pageLimit, 100);

	const recurse = async (
		remainingKeys: Array<T['IndexKeyMap'][T['PrimaryIndex']]>
	): Promise<BatchGetItemsOutput<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
		const currentKeys = remainingKeys.slice(0, limitedPageLimit);

		const output = await dkClient.send(
			new DkBatchGetCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>({
				requests: {
					[Table.tableName]: {
						keys: currentKeys,
						...rest
					}
				},
				returnConsumedCapacity
			})
		);

		const nextRemainingKeys = remainingKeys.slice(limitedPageLimit);

		const items = output.items[Table.tableName];
		const unprocessedRequests = output.unprocessedRequests[Table.tableName] || { keys: [] };

		if (nextRemainingKeys.length === 0) {
			return {
				items,
				unprocessedRequests
			};
		}

		const nextPage = await recurse(nextRemainingKeys);

		return {
			items: [...items, ...nextPage.items],
			unprocessedRequests: {
				keys: [...unprocessedRequests.keys, ...nextPage.unprocessedRequests.keys],
				...rest
			}
		};
	};

	return recurse(keys);
};

export const batchGetItems = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	keys: Array<Parameters<K['keyOf']>[0]>,
	input?: BatchGetItemsInput
): Promise<BatchGetItemsOutput<K['Attributes'], K['IndexKeyMap'][K['PrimaryIndex']]>> => {
	const output = await batchGetTableItems(
		KeySpace.Table,
		keys.map(key => KeySpace.keyOf(key as any), input),
		input,
		KeySpace.dkClient
	);

	return {
		...output,
		items: output.items.map(item => KeySpace.omitIndexKeys(item))
	};
};
