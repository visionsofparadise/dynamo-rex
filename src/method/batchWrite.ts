import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../Dx';
import { Table } from '../Table';
import { DxBatchWriteCommand, DxBatchWriteCommandInput, DxBatchWriteCommandOutput } from '../command/BatchWrite';

export interface DxBatchWriteInput extends Omit<DxBatchWriteCommandInput, 'requests'> {
	pageLimit?: number;
}

export interface DxBatchWriteOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Partial<Omit<DxBatchWriteCommandOutput, 'unprocessedRequests'>> {
	unprocessedRequests: NonNullable<DxBatchWriteCommandOutput<Attributes, Key>['unprocessedRequests']>[string];
}

export const dxTableBatchWrite = async <T extends Table = Table>(
	Table: T,
	requests: Array<{ put: T['AttributesAndIndexKeys'] } | { delete: T['IndexKeyMap'][T['PrimaryIndex']] }>,
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
	if (requests.length === 0) {
		return {
			unprocessedRequests: []
		};
	}

	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: DxBatchWriteCommandInput<
			T['AttributesAndIndexKeys'],
			T['IndexKeyMap'][T['PrimaryIndex']]
		>['requests'][string]
	): Promise<DxBatchWriteOutput<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const output = await Table.dxClient.send(
			new DxBatchWriteCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>({
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

export const dxBatchWrite = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	requests: Array<{ put: K['Attributes'] } | { delete: Parameters<K['keyOf']>[0] }>,
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<K['AttributesAndIndexKeys'], K['IndexKeyMap'][K['PrimaryIndex']]>> =>
	dxTableBatchWrite(
		KeySpace.Table,
		requests.map(request => {
			if ('put' in request) {
				return KeySpace.withIndexKeys(request.put);
			}

			return KeySpace.keyOf(request.delete as any);
		}),
		input
	);
