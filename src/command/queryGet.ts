import { AnyKeySpace, KeySpace } from '../KeySpace';
import { DxQueryInput, dxQuery } from './query';
import { run } from '../util/utils';
import { primaryIndex } from '../Table';

export type DxQueryGetInput<
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
> = Omit<DxQueryInput<K, Index>, 'keyConditionExpression' | 'index'>;

export type DxQueryGetOutput<K extends AnyKeySpace = AnyKeySpace> = K['Attributes'];

export const dxQueryGet = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
>(
	KeySpace: K,
	index: K['Index'],
	keyParams: KeySpace.GetKeyParams<K, Index>,
	input?: DxQueryGetInput<K, Index>
): Promise<DxQueryGetOutput<K>> => {
	const setIndex = index !== primaryIndex ? index : undefined;

	const key = (KeySpace as KeySpace).indexKeyOf(index, keyParams);

	const hashKey = KeySpace.Table.config.indexes[index].hash.key;
	const sortKey = KeySpace.Table.config.indexes[index].sort?.key;

	const output = await run(async () => {
		if (sortKey) {
			return dxQuery(KeySpace, {
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

		return dxQuery(KeySpace, {
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
