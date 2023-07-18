import { ILogger } from './util/utils';
import { Defaults } from './util/defaults';
import { MiddlewareHandlerHook, MiddlewareHandler, appendMiddleware } from './util/middleware';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { DxBase, DxConfig } from './Dx';
import { KeySpace } from './KeySpace';
import { U } from 'ts-toolbelt';

export const primaryIndex = 'primaryIndex' as const;

export type PrimaryIndex = typeof primaryIndex;

export namespace Table {
	export type GetIndexKeyFromConfig<
		Config extends PrimaryIndexConfig | SecondaryIndexConfig = PrimaryIndexConfig | SecondaryIndexConfig
	> = U.Merge<
		| {
				[x in Config['hash']['key']]: IndexAttributeValueToType<Config['hash']['value']>;
		  }
		| (Config['sort'] extends IndexAttributeConfig
				? { [x in Config['sort']['key']]: IndexAttributeValueToType<Config['sort']['value']> }
				: {})
	>;

	export type GetIndexKey<T extends Table, Index extends T['Index'] = T['Index']> = T['IndexKeyMap'][Index];

	export type GetIndexCursorKey<T extends Table, Index extends T['SecondaryIndex']> = U.Merge<
		GetIndexKey<T, Exclude<PrimaryIndex | Index, never>>
	>;
}

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

export interface TableConfig<
	AttributeKey extends string = string,
	AttributeValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> extends Partial<DxConfig> {
	name: string;
	indexes: Record<PrimaryIndex, PrimaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue>> &
		Record<
			Exclude<string, PrimaryIndex>,
			SecondaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue, ProjectionKeys, Projection>
		>;
}

export class Table<
	Attributes extends Record<string, NativeAttributeValue> = any,
	AttributeKey extends string = any,
	AttributeValue extends IndexAttributeValue = any,
	ProjectionKeys extends string = any,
	Projection extends IndexProjection<ProjectionKeys> = any,
	Config extends TableConfig<AttributeKey, AttributeValue, ProjectionKeys, Projection> = any
> {
	client: DynamoDBDocumentClient;
	defaults: Defaults;
	logger?: ILogger;

	constructor(public Dx: DxBase, public config: Config, public middleware: Array<MiddlewareHandler> = []) {
		this.client = config.client || Dx.client;
		this.defaults = { ...Dx.defaults, ...config.defaults };
		this.logger = config.logger || Dx.logger;
	}

	configure<
		ConfigAttributeKey extends string,
		ConfigAttributeValue extends IndexAttributeValue,
		ConfigProjectionKeys extends string,
		ConfigProjection extends IndexProjection<ConfigProjectionKeys>,
		ConfigConfig extends TableConfig<ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection>
	>(
		config: ConfigConfig
	): Table<Attributes, ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection, ConfigConfig> {
		return new Table<
			Attributes,
			ConfigAttributeKey,
			ConfigAttributeValue,
			ConfigProjectionKeys,
			ConfigProjection,
			ConfigConfig
		>(this.Dx, config, this.middleware);
	}

	get KeySpace() {
		const ParentTable = new Table<Attributes, AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>(
			this.Dx,
			this.config,
			this.middleware
		);

		return class TableKeySpace<
			KeySpaceAttributes extends Attributes = Attributes,
			SecondaryIndex extends (typeof ParentTable)['SecondaryIndex'] | never = never
		> extends KeySpace<
			Table<Attributes, AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>,
			KeySpaceAttributes,
			SecondaryIndex
		> {
			constructor() {
				super(ParentTable, {} as any, ParentTable.middleware);
			}
		};
	}

	Attributes!: Attributes;

	Index!: string & keyof Config['indexes'];
	PrimaryIndex!: PrimaryIndex;
	SecondaryIndex!: string & Exclude<this['Index'], PrimaryIndex>;

	IndexKeyMap!: {
		[x in this['Index']]: Table.GetIndexKeyFromConfig<Config['indexes'][x]>;
	};

	AttributesAndIndexKeys!: Attributes &
		this['IndexKeyMap'][PrimaryIndex] &
		Partial<U.Merge<this['IndexKeyMap'][this['SecondaryIndex']]>>;

	get indexes() {
		return Object.keys(this.config.indexes) as Array<string & keyof Config['indexes']>;
	}

	get attributeKeys() {
		return this.indexes.flatMap(index => {
			const indexConfig = this.config.indexes[index];

			return indexConfig.sort ? [indexConfig.hash.key, indexConfig.sort.key] : [indexConfig.hash.key];
		}) as Array<AttributeKey>;
	}

	omitIndexKeys<Item extends Partial<Attributes & U.Merge<this['IndexKeyMap'][this['Index']]>>>(
		itemWithIndexKeys: Item
	) {
		const keyMap = new Map(this.attributeKeys.map(key => [key, true]));

		return Object.fromEntries(Object.entries(itemWithIndexKeys).filter(([key]) => !keyMap.has(key as any))) as Omit<
			Item,
			AttributeKey
		>;
	}

	addMiddleware = (newMiddleware: Array<MiddlewareHandler<MiddlewareHandlerHook>>) => {
		const middleware = appendMiddleware(this.middleware, newMiddleware);

		return new Table<Attributes, AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>(
			this.Dx,
			this.config,
			middleware
		);
	};
}
