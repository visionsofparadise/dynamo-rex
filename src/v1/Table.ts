import { ILogger, UnionToIntersection } from './util/utils';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { KeySpace } from './KeySpace';
import { EventHandlers } from './util/eventHandlers';
import { Defaults } from './util/defaults';

export type ConvertConfigToIndexKey<
	Config extends PrimaryIndexConfig | SecondaryIndexConfig = PrimaryIndexConfig | SecondaryIndexConfig
> = Record<Config['hash']['key'], IndexAttributeValueToType<Config['hash']['value']>> &
	(Config['sort'] extends IndexAttributeConfig
		? Record<Config['sort']['key'], IndexAttributeValueToType<Config['sort']['value']>>
		: {});

export const primaryIndex = 'primaryIndex' as const;

export type PrimaryIndex = typeof primaryIndex;

export type GetTableIndex<T extends Table = Table> = string & keyof T['config']['indexes'];

export type GetTableIndexConfigMap<T extends Table = Table> = {
	[x in GetTableIndex<T>]: T['config']['indexes'][x];
};

export type GetTableIndexConfig<
	T extends Table = Table,
	Index extends GetTableIndex<T> = GetTableIndex<T>
> = GetTableIndexConfigMap<T>[Index];

export type GetTableSecondaryIndex<T extends Table = Table> = Exclude<GetTableIndex<T>, PrimaryIndex>;

export type GetTableIndexKeyMap<T extends Table = Table> = {
	[x in keyof GetTableIndexConfigMap<T>]: ConvertConfigToIndexKey<GetTableIndexConfigMap<T>[x]>;
};

export type GetTableIndexKey<
	T extends Table = Table,
	Index extends GetTableIndex<T> = GetTableIndex<T>
> = GetTableIndexKeyMap<T>[Index];

export type GetTableIndexKeys<
	T extends Table = Table,
	Index extends GetTableIndex<T> = GetTableIndex<T>
> = {} & UnionToIntersection<GetTableIndexKeyMap<T>[Index]>;

export type GetTableIndexCursorKey<
	T extends Table = Table,
	Index extends GetTableIndex<T> = GetTableIndex<T>
> = Index extends GetTableSecondaryIndex<T>
	? GetTableIndexKeys<T, PrimaryIndex | Index>
	: GetTableIndexKey<T, PrimaryIndex>;

export type GetTableBaseAttributes<T extends Table = Table> = T extends Table<infer A> ? A : never;

export type IndexAttributeValue = 'string' | 'string?' | 'number' | 'number?';

export type IndexAttributeValueToType<T extends IndexAttributeValue = 'string'> = T extends 'string'
	? string
	: T extends 'string?'
	? string | undefined
	: T extends 'number'
	? number
	: T extends 'number?'
	? number | undefined
	: never;

export interface IndexAttributeConfig<
	Key extends string = string,
	Value extends IndexAttributeValue = IndexAttributeValue
> {
	key: Key;
	value: Value;
}

export interface PrimaryIndexConfig<
	HashKey extends string = string,
	HashValue extends IndexAttributeValue = IndexAttributeValue,
	SortKey extends string = string,
	SortValue extends IndexAttributeValue = IndexAttributeValue
> {
	hash: IndexAttributeConfig<HashKey, Extract<HashValue, 'string' | 'number'>>;
	sort?: IndexAttributeConfig<SortKey, SortValue>;
}

export type IndexProjection<Attributes extends string> = never | never[] | Attributes[];

export interface SecondaryIndexConfig<
	HashKey extends string = string,
	HashValue extends IndexAttributeValue = IndexAttributeValue,
	SortKey extends string = string,
	SortValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> extends PrimaryIndexConfig<HashKey, HashValue, SortKey, SortValue> {
	projection?: Projection;
}

export interface IndexConfig<
	AttributeKey extends string = string,
	AttributeValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> {
	indexes: {
		primaryIndex: PrimaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue>;
	} & Record<
		Exclude<string, PrimaryIndex>,
		SecondaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue, ProjectionKeys, Projection>
	>;
}

export interface TableConfig<
	AttributeKey extends string = string,
	AttributeValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> extends IndexConfig<AttributeKey, AttributeValue, ProjectionKeys, Projection> {
	name: string;
	logger?: ILogger;
	defaults?: Defaults;
}

export class Table<
	BaseAttributes extends Record<string, any> = any,
	AttributeKey extends string = any,
	AttributeValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>,
	Config extends TableConfig<AttributeKey, AttributeValue, ProjectionKeys, Projection> = TableConfig<
		AttributeKey,
		AttributeValue,
		ProjectionKeys,
		Projection
	>
> {
	defaults?: Defaults;

	constructor(public client: DynamoDBDocumentClient, public config: Config, public eventHandlers?: EventHandlers) {
		this.defaults = config.defaults;
	}

	configure<
		ConfigAttributeKey extends string = string,
		ConfigAttributeValue extends IndexAttributeValue = IndexAttributeValue,
		ConfigProjectionKeys extends string = string,
		ConfigProjection extends IndexProjection<ConfigProjectionKeys> = IndexProjection<ConfigProjectionKeys>,
		ConfigureConfig extends TableConfig<
			ConfigAttributeKey,
			ConfigAttributeValue,
			ConfigProjectionKeys,
			ConfigProjection
		> = TableConfig<ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection>
	>(
		config: ConfigureConfig,
		eventHandlers?: EventHandlers
	): Table<
		BaseAttributes,
		ConfigAttributeKey,
		ConfigAttributeValue,
		ConfigProjectionKeys,
		ConfigProjection,
		ConfigureConfig
	> {
		return new Table<
			BaseAttributes,
			ConfigAttributeKey,
			ConfigAttributeValue,
			ConfigProjectionKeys,
			ConfigProjection,
			ConfigureConfig
		>(this.client, config, eventHandlers);
	}

	get KeySpace() {
		const ParentTable = this;
		type ParentTable = Table<BaseAttributes, AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>;

		return class TableKeySpace<ItemAttributes extends BaseAttributes = BaseAttributes> extends KeySpace<
			ParentTable,
			ItemAttributes,
			never
		> {
			constructor() {
				super(ParentTable, {
					secondaryIndexes: [],
					indexValueHandlers: {} as any
				});
			}
		};
	}
}
