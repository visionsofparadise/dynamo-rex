import { PrimaryIndex, primaryIndex } from '../Table';
import { AnyKeySpace, KeySpace } from '../KeySpace';
import { DxQueryItemsInput, DxQueryItemsOutput, dxQueryItems } from './queryItems';
import { DxQuickQueryOperators, createQueryQuickSort } from '../util/createSortKeyQuery';

export type DxQuickQueryItemsInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
> = Omit<DxQueryItemsInput<K, Index>, 'keyConditionExpression'> &
	DxQuickQueryOperators & {
		hashKeyParams: K['IndexValueParamsMap'][Index extends never
			? PrimaryIndex
			: Index][K['Table']['config']['indexes'][Index extends never ? PrimaryIndex : Index]['hash']['key']];
	};

export type DxQuickQueryItemsOutput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
> = DxQueryItemsOutput<K, Index>;

export const dxQuickQueryItems = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
>(
	KeySpace: K,
	input: DxQuickQueryItemsInput<K, Index>
): Promise<DxQuickQueryItemsOutput<K, Index>> => {
	const index = input.index || primaryIndex;

	const hashKey = KeySpace.Table.config.indexes[index].hash.key;
	const hashValue = (KeySpace as KeySpace).indexAttributeValue(index, hashKey, input.hashKeyParams);

	const sortKey = KeySpace.Table.config.indexes[index].sort.key;
	const sortParams = createQueryQuickSort(sortKey, input);

	const output = await dxQueryItems(KeySpace, {
		...input,
		keyConditionExpression: `${hashKey} = :hashValue ${sortParams.KeyConditionExpression || ''}`,
		expressionAttributeValues: {
			[`:hashValue`]: hashValue,
			...sortParams.ExpressionAttributeValues,
			...input.expressionAttributeValues
		}
	});

	return output;
};
