import {
	GetTableBaseAttributes,
	GetTableIndexKey,
	GetTableIndexKeys,
	GetTableSecondaryIndex,
	PrimaryIndex,
	Table,
	primaryIndex
} from './Table';
import { UnionToIntersection, zipObject } from './util/utils';
import { EventHandlers } from './util/eventHandlers';
import { Defaults } from './util/defaults';

export type GetKeySpaceSecondaryIndex<K extends KeySpace = KeySpace> = string & K['config']['secondaryIndexes'][number];

export type GetKeySpaceIndex<K extends KeySpace = KeySpace> = GetKeySpaceSecondaryIndex<K> | PrimaryIndex;

export type GetKeySpaceIndexValueParams<
	K extends KeySpace = KeySpace,
	Index extends GetKeySpaceIndex<K> = GetKeySpaceIndex<K>
> = K extends KeySpace<infer T>
	? UnionToIntersection<Parameters<K['config']['indexValueHandlers'][keyof GetTableIndexKey<T, Index>]>[0]>
	: never;

export type GetKeySpaceAttributes<K extends KeySpace = KeySpace> = K extends KeySpace<infer T>
	? K extends KeySpace<T, infer A>
		? A
		: never
	: never;

export type IndexValueHandlers<
	ParentTable extends Table = Table,
	Attributes extends GetTableBaseAttributes<ParentTable> = GetTableBaseAttributes<ParentTable>,
	SecondaryIndex extends GetTableSecondaryIndex<ParentTable> = GetTableSecondaryIndex<ParentTable>
> = {
	[x in keyof GetTableIndexKey<ParentTable, PrimaryIndex | SecondaryIndex>]: (
		params: Attributes
	) => GetTableIndexKey<ParentTable, PrimaryIndex | SecondaryIndex>[x];
};

export interface KeySpaceConfig<
	ParentTable extends Table = Table,
	Attributes extends GetTableBaseAttributes<ParentTable> = GetTableBaseAttributes<ParentTable>,
	SecondaryIndex extends GetTableSecondaryIndex<ParentTable> = GetTableSecondaryIndex<ParentTable>
> {
	secondaryIndexes: Array<SecondaryIndex>;
	indexValueHandlers: IndexValueHandlers<ParentTable, Attributes, SecondaryIndex>;
	defaults?: Defaults;
}

export class KeySpace<
	ParentTable extends Table = Table,
	Attributes extends GetTableBaseAttributes<ParentTable> = GetTableBaseAttributes<ParentTable>,
	SecondaryIndex extends GetTableSecondaryIndex<ParentTable> = GetTableSecondaryIndex<ParentTable>,
	Config extends KeySpaceConfig<ParentTable, Attributes, SecondaryIndex> = KeySpaceConfig<
		ParentTable,
		Attributes,
		SecondaryIndex
	>
> {
	defaults?: Defaults;

	constructor(public Table: ParentTable, public config: Config, public eventHandlers?: EventHandlers) {
		this.defaults = config.defaults;
	}

	configure<
		ConfigSecondaryIndex extends GetTableSecondaryIndex<ParentTable> = GetTableSecondaryIndex<ParentTable>,
		ConfigureConfig extends KeySpaceConfig<ParentTable, Attributes, ConfigSecondaryIndex> = KeySpaceConfig<
			ParentTable,
			Attributes,
			ConfigSecondaryIndex
		>
	>(
		config: ConfigureConfig,
		eventHandlers?: EventHandlers
	): KeySpace<ParentTable, Attributes, ConfigSecondaryIndex, ConfigureConfig> {
		return new KeySpace<ParentTable, Attributes, ConfigSecondaryIndex, ConfigureConfig>(
			this.Table,
			config,
			eventHandlers
		);
	}

	get indexKeyKeys() {
		return Object.keys(this.config.indexValueHandlers);
	}

	indexValueOf<Key extends keyof Config['indexValueHandlers']>(
		key: Key,
		params: Parameters<Config['indexValueHandlers'][Key]>[0]
	) {
		return this.config.indexValueHandlers[key as keyof IndexValueHandlers<ParentTable, Attributes, SecondaryIndex>](
			params
		);
	}

	keyOf(
		params: Parameters<Config['indexValueHandlers'][keyof GetTableIndexKey<ParentTable, PrimaryIndex>]>[0]
	): GetTableIndexKey<ParentTable, PrimaryIndex> {
		return this.indexKeyOf(primaryIndex, params);
	}

	indexKeyOf<Index extends PrimaryIndex | SecondaryIndex>(
		index: Index,
		params: Parameters<Config['indexValueHandlers'][keyof GetTableIndexKey<ParentTable, Index>]>[0]
	): GetTableIndexKey<ParentTable, Index> {
		const { hash, sort } = this.Table.config.indexes[index];

		const keys = (sort ? [hash.key, sort.key] : [hash.key]) as Array<keyof GetTableIndexKey<ParentTable, Index>>;

		const values = keys.map(key => this.indexValueOf(key, params));

		return zipObject(keys, values);
	}

	indexKeysOf(item: Attributes): GetTableIndexKeys<ParentTable, PrimaryIndex | SecondaryIndex> {
		return [primaryIndex, ...this.config.secondaryIndexes].reduce(
			(currentIndexKeys, index) => ({ ...currentIndexKeys, ...this.indexKeyOf(index, item) }),
			{}
		) as GetTableIndexKeys<ParentTable, PrimaryIndex | SecondaryIndex>;
	}

	withIndexKeys(item: Attributes): Attributes & GetTableIndexKeys<ParentTable, PrimaryIndex | SecondaryIndex> {
		return { ...item, ...this.indexKeysOf(item) };
	}

	omitIndexKeys(
		itemWithIndexKeys: Attributes & GetTableIndexKeys<ParentTable, PrimaryIndex | SecondaryIndex>
	): Attributes {
		const indexKeyKeysMap = new Map(this.indexKeyKeys.map(key => [key, true]));

		return Object.fromEntries(
			Object.entries(itemWithIndexKeys).filter(([key]) => !indexKeyKeysMap.has(key))
		) as Attributes;
	}
}
