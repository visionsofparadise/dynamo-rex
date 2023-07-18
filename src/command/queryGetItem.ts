import { AnyKeySpace, KeySpace } from '../KeySpace';
import { DxQueryItemsInput, dxQueryItems } from './queryItems';
import { run } from '../util/utils';
import { primaryIndex } from '../Table';

export type DxQueryGetItemInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
> = Omit<DxQueryItemsInput<K, Index>, 'keyConditionExpression' | 'index'>;

export type DxQueryGetItemOutput<K extends AnyKeySpace = AnyKeySpace> = K['Attributes'];

export const dxQueryGetItem = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
>(
	KeySpace: K,
	index: K['Index'],
	keyParams: KeySpace.GetKeyParams<K, Index>,
	input?: DxQueryGetItemInput<K, Index>
): Promise<DxQueryGetItemOutput<K>> => {
	const setIndex = index !== primaryIndex ? index : undefined;

	const key = (KeySpace as KeySpace).indexKeyOf(index, keyParams);

	const hashKey = KeySpace.Table.config.indexes[index].hash.key;
	const sortKey = KeySpace.Table.config.indexes[index].sort?.key;

	const output = await run(async () => {
		if (sortKey) {
			return dxQueryItems(KeySpace, {
				...input,
				index: setIndex,
				pageLimit: 1,
				keyConditionExpression: `${hashKey} = :hashValue AND ${sortKey} = :sortValue`,
				expressionAttributeValues: {
					[`:hashValue`]: key[hashKey],
					[`:sortValue`]: key[sortKey],
					...input?.expressionAttributeValues
				}
			});
		}

		return dxQueryItems(KeySpace, {
			...input,
			index: setIndex,
			pageLimit: 1,
			keyConditionExpression: `${hashKey} = :hashValue`,
			expressionAttributeValues: {
				[`:hashValue`]: key[hashKey],
				...input?.expressionAttributeValues
			}
		});
	});

	if (!output.items[0]) throw new Error('Not Found');

	return output.items[0];
};
