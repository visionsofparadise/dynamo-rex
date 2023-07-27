import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { DkBatchWriteCommand, DkBatchWriteCommandInput, DkBatchWriteCommandOutput } from '../command/BatchWrite';
import { DkClient } from '../Client';

export interface BatchWriteItemsInput extends Omit<DkBatchWriteCommandInput, 'requests'> {
	pageLimit?: number;
}

export interface BatchWriteItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Partial<Omit<DkBatchWriteCommandOutput, 'unprocessedRequests'>> {
	unprocessedRequests: NonNullable<DkBatchWriteCommandOutput<Attributes, Key>['unprocessedRequests']>[string];
}

export const batchWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<{ put: T['Attributes'] } | { delete: T['IndexKeyMap'][T['PrimaryIndex']] }>,
	input?: BatchWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<BatchWriteItemsOutput<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
	if (requests.length === 0) {
		return {
			unprocessedRequests: []
		};
	}

	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: DkBatchWriteCommandInput<
			T['Attributes'],
			T['IndexKeyMap'][T['PrimaryIndex']]
		>['requests'][string]
	): Promise<BatchWriteItemsOutput<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const output = await dkClient.send(
			new DkBatchWriteCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>({
				...input,
				requests: {
					[Table.tableName]: currentRequests
				}
			})
		);

		const unprocessedRequests = output.unprocessedRequests[Table.tableName] || [];

		const nextRemainingRequests = remainingRequests.slice(pageLimit);

		if (nextRemainingRequests.length === 0) {
			return {
				...output,
				unprocessedRequests: unprocessedRequests
			};
		}

		const nextPage = await recurse(nextRemainingRequests);

		return {
			...output,
			unprocessedRequests: [...unprocessedRequests, ...nextPage.unprocessedRequests]
		};
	};

	return recurse(requests);
};

export const batchWriteItems = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	requests: Array<{ put: K['Attributes'] } | { delete: Parameters<K['keyOf']>[0] }>,
	input?: BatchWriteItemsInput
): Promise<BatchWriteItemsOutput<K['AttributesAndIndexKeys'], K['IndexKeyMap'][K['PrimaryIndex']]>> =>
	batchWriteTableItems(
		KeySpace.Table,
		requests.map(request => {
			if ('put' in request) {
				return { put: KeySpace.withIndexKeys(request.put) };
			}

			return { delete: KeySpace.keyOf(request.delete as any) };
		}),
		input,
		KeySpace.dkClient
	);
