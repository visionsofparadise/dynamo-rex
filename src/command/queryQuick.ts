import { PrimaryIndex, primaryIndex } from '../Table';
import { AnyKeySpace, KeySpace } from '../KeySpace';
import { DxQueryInput, DxQueryOutput, dxQuery } from './query';
import { DxQuickQueryOperators, createQueryQuickSort } from '../util/createSortKeyQuery';

export type DxQueryQuickInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
> = Omit<DxQueryInput<K, Index>, 'keyConditionExpression'> &
	DxQuickQueryOperators & {
		hashKeyParams: K['IndexHashKeyValueParamsMap'][Index extends never | undefined ? PrimaryIndex : Index];
	};

export type DxQueryQuickOutput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
> = DxQueryOutput<K, Index>;

export const dxQueryQuick = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: DxQueryQuickInput<K, Index>
): Promise<DxQueryQuickOutput<K, Index>> => {
	const index = input.index || primaryIndex;

	const hashKey = KeySpace.Table.config.indexes[index].hash.key;
	const hashValue = (KeySpace as KeySpace).indexAttributeValue(index, hashKey, input.hashKeyParams);

	const sortKey = KeySpace.Table.config.indexes[index].sort.key;
	const sortParams = createQueryQuickSort(sortKey, input);

	const output = await dxQuery(KeySpace, {
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
