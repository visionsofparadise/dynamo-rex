import { PrimaryIndex, Table, primaryIndex } from '../Table';
import { AnyKeySpace } from '../KeySpace';
import { DxQueryInput, DxQueryOutput, dxTableQuery } from './query';
import { DxQuickQueryOperators, createQueryQuickSort } from '../util/createSortKeyQuery';
import { GenericAttributes } from '../Dx';

export type DxQueryQuickInput<
	Index extends string | never | undefined = never | undefined,
	CursorKey extends GenericAttributes = GenericAttributes,
	HashKeyParams extends any = any
> = Omit<DxQueryInput<Index, CursorKey>, 'keyConditionExpression'> &
	DxQuickQueryOperators & {
		hashKeyParams: HashKeyParams;
	};

export type DxQueryQuickOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = DxQueryOutput<Attributes, CursorKey>;

export const dxTableQueryQuick = async <
	T extends Table = Table,
	Index extends T['SecondaryIndex'] | never | undefined = never | undefined
>(
	Table: T,
	input: DxQueryQuickInput<
		Index & string,
		Table.GetIndexCursorKey<T, Index & string>,
		T['IndexKeyMap'][Index & string][T['config']['indexes'][Index & string]['hash']['key']]
	>
): Promise<DxQueryQuickOutput<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>> => {
	const index = input.index || primaryIndex;

	const { hashKeyParams, beginsWith, greaterThan, lessThan, ...inputRest } = input;

	const hashKey = Table.config.indexes[index].hash.key;
	const hashValue = hashKeyParams![hashKey as keyof typeof hashKeyParams];

	const sortKey = Table.config.indexes[index].sort.key;

	const sortParams = createQueryQuickSort(sortKey, { beginsWith, greaterThan, lessThan });

	const output = await dxTableQuery(Table, {
		...inputRest,
		keyConditionExpression: `${hashKey} = :hashValue ${sortParams.keyConditionExpression || ''}`,
		expressionAttributeValues: {
			[`:hashValue`]: hashValue,
			...sortParams.expressionAttributeValues,
			...input.expressionAttributeValues
		}
	});

	return output;
};

export const dxQueryQuick = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: DxQueryQuickInput<
		Index,
		Table.GetIndexCursorKey<K['Table'], Index>,
		{} & K['IndexHashKeyValueParamsMap'][Index extends never | undefined ? PrimaryIndex : Index]
	>
): Promise<DxQueryQuickOutput<K['Attributes'], Table.GetIndexCursorKey<K['Table'], Index>>> => {
	const index = input.index || primaryIndex;

	const hashKeyValue = KeySpace.indexAttributeValue(
		index,
		KeySpace.Table.config.indexes[index].hash.key,
		input.hashKeyParams as any
	);

	const hashKeyParams = {
		[KeySpace.Table.config.indexes[index].hash.key]: hashKeyValue
	};

	const output = (await dxTableQueryQuick(KeySpace.Table, { ...input, hashKeyParams })) as DxQueryQuickOutput<
		K['AttributesAndIndexKeys'],
		Table.GetIndexCursorKey<K['Table'], Index>
	>;

	return {
		...output,
		items: output.items.map(item => KeySpace.omitIndexKeys(item))
	};
};
