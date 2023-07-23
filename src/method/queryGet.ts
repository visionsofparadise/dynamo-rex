import { AnyKeySpace, KeySpace } from '../KeySpace';
import { DxListParams, DxQueryInput, dxTableQuery } from './query';
import { run } from '../util/utils';
import { Table, primaryIndex } from '../Table';
import { GenericAttributes } from '../Dx';

export type DxQueryGetInput = Omit<DxQueryInput<any, any>, 'keyConditionExpression' | keyof DxListParams<any> | 'sort'>;

export type DxQueryGetOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export const dxTableQueryGet = async <T extends Table = Table, Index extends T['Index'] | never = never>(
	Table: T,
	index: T['Index'],
	key: T['IndexKeyMap'][Index],
	input?: DxQueryGetInput
): Promise<DxQueryGetOutput<T['AttributesAndIndexKeys']>> => {
	const setIndex = index !== primaryIndex ? index : undefined;

	const hashKey = Table.config.indexes[index].hash.key;
	const sortKey = Table.config.indexes[index].sort?.key;

	const output = await run(async () => {
		if (sortKey) {
			return dxTableQuery(Table, {
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

		return dxTableQuery(Table, {
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

export const dxQueryGet = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never = never
>(
	KeySpace: K,
	index: Index,
	keyParams: KeySpace.GetKeyParams<K, Index>,
	input?: DxQueryGetInput
): Promise<DxQueryGetOutput<K['Attributes']>> => {
	const item = (await dxTableQueryGet(
		KeySpace.Table,
		index,
		KeySpace.indexKeyOf(index, keyParams as any),
		input
	)) as DxQueryGetOutput<K['AttributesAndIndexKeys']>;

	return KeySpace.omitIndexKeys(item);
};
