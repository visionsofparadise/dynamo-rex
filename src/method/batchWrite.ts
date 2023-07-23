import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../Dx';
import { Table } from '../Table';
import { DxBatchWriteCommand, DxBatchWriteCommandInput, DxBatchWriteCommandOutput } from '../command/BatchWrite';

export interface DxBatchWriteInput extends Omit<DxBatchWriteCommandInput, 'requestItems'> {
	pageLimit?: number;
}

export interface DxBatchWriteOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<DxBatchWriteCommandOutput, 'unprocessedItems'> {
	unprocessedItems?: NonNullable<DxBatchWriteCommandOutput<Attributes, Key>['unprocessedItems']>[string];
}

export const dxTableBatchWrite = async <T extends Table = Table>(
	Table: T,
	requests: DxBatchWriteCommandInput<
		T['AttributesAndIndexKeys'],
		T['IndexKeyMap'][T['PrimaryIndex']]
	>['requestItems'][string],
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: DxBatchWriteCommandInput<
			T['AttributesAndIndexKeys'],
			T['IndexKeyMap'][T['PrimaryIndex']]
		>['requestItems'][string]
	): Promise<DxBatchWriteOutput<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const output = await Table.dxClient.send(
			new DxBatchWriteCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>({
				...input,
				requestItems: {
					[Table.tableName]: currentRequests
				}
			})
		);

		const unprocessedRequests = output.unprocessedItems ? output.unprocessedItems[Table.tableName] : [];

		const nextRemainingRequests = remainingRequests.slice(pageLimit);

		if (nextRemainingRequests.length === 0) {
			return {
				...output,
				unprocessedItems: unprocessedRequests
			};
		}

		const nextPage = await recurse(nextRemainingRequests);

		return {
			...output,
			unprocessedItems: [...(unprocessedRequests || []), ...(nextPage.unprocessedItems || [])]
		};
	};

	return recurse(requests);
};

export const dxBatchWrite = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	requests: DxBatchWriteCommandInput<K['Attributes'], Parameters<K['keyOf']>[0]>['requestItems'][string],
	input?: DxBatchWriteInput
): Promise<DxBatchWriteOutput<K['AttributesAndIndexKeys'], K['IndexKeyMap'][K['PrimaryIndex']]>> =>
	dxTableBatchWrite(
		KeySpace.Table,
		requests.map(request => {
			if ('put' in request) {
				return KeySpace.withIndexKeys(request as any);
			}

			return KeySpace.keyOf(request as any);
		}),
		input
	);
