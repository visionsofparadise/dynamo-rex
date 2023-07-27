import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { KeySpace } from './KeySpace';
import { A, U } from 'ts-toolbelt';
import { appendMiddleware } from './Middleware';
import { DkClient, DkClientConfig } from './Client';
import { GenericAttributes } from './util/utils';

export const primaryIndex = 'primaryIndex' as const;

export type PrimaryIndex = typeof primaryIndex;

export namespace Table {
	export type GetIndexKeyFromConfig<
		Config extends PrimaryIndexConfig | SecondaryIndexConfig = PrimaryIndexConfig | SecondaryIndexConfig
	> = U.IntersectOf<
		| {
				[x in Config['hash']['key']]: IndexAttributeValueToType<Config['hash']['value']>;
		  }
		| (Config['sort'] extends IndexAttributeConfig
				? { [x in Config['sort']['key']]: IndexAttributeValueToType<Config['sort']['value']> }
				: {})
	>;

	export type GetIndexKey<T extends Table, Index extends T['Index'] = T['Index']> = T['IndexKeyMap'][Index];

	export type GetIndexCursorKey<T extends Table, Index extends T['SecondaryIndex']> = A.Cast<
		U.IntersectOf<GetIndexKey<T, Exclude<PrimaryIndex | Index, never>>>,
		{}
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
> extends Partial<DkClientConfig> {
	client: DynamoDBDocumentClient;
	name: string;
	indexes: Record<PrimaryIndex, PrimaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue>> &
		Record<
			Exclude<string, PrimaryIndex>,
			SecondaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue, ProjectionKeys, Projection>
		>;
}

export class Table<
	AttributeKey extends string = any,
	AttributeValue extends IndexAttributeValue = any,
	ProjectionKeys extends string = any,
	Projection extends IndexProjection<ProjectionKeys> = any,
	Config extends TableConfig<AttributeKey, AttributeValue, ProjectionKeys, Projection> = any
> {
	client: DynamoDBDocumentClient;
	dkClient: DkClient;

	tableName: string;

	constructor(public config: Config) {
		this.client = config.client;
		this.dkClient = new DkClient(config.client);

		this.dkClient.setDefaults({ ...this.dkClient.defaults, ...config.defaults });
		this.dkClient.setMiddleware(appendMiddleware(this.dkClient.middleware, config.middleware || []));

		this.tableName = config.name;
	}

	get KeySpace() {
		const ParentTable = new Table<AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>(this.config);

		return class TableKeySpace<
			Attributes extends GenericAttributes = GenericAttributes,
			SecondaryIndex extends (typeof ParentTable)['SecondaryIndex'] | never = never
		> extends KeySpace<
			Table<AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>,
			Attributes,
			SecondaryIndex
		> {
			constructor() {
				super(ParentTable, {} as any);
			}
		};
	}

	Attributes!: this['IndexKeyMap'][PrimaryIndex] & Partial<U.IntersectOf<this['IndexKeyMap'][this['SecondaryIndex']]>>;

	Index!: string & keyof Config['indexes'];
	PrimaryIndex!: PrimaryIndex;
	SecondaryIndex!: string & Exclude<this['Index'], PrimaryIndex>;

	IndexKeyMap!: {
		[x in this['Index']]: Table.GetIndexKeyFromConfig<Config['indexes'][x]>;
	};

	get indexes(): Array<this['Index']> {
		return Object.keys(this.config.indexes) as Array<this['Index']>;
	}

	get attributeKeys(): Array<AttributeKey> {
		return this.indexes.flatMap(index => {
			const indexConfig = this.config.indexes[index];

			return indexConfig.sort ? [indexConfig.hash.key, indexConfig.sort.key] : [indexConfig.hash.key];
		}) as Array<AttributeKey>;
	}

	omitIndexKeys<Item extends Partial<this['Attributes']>>(itemWithIndexKeys: Item): Omit<Item, AttributeKey> {
		const keyMap = new Map(this.attributeKeys.map(key => [key, true]));

		return Object.fromEntries(Object.entries(itemWithIndexKeys).filter(([key]) => !keyMap.has(key as any))) as Omit<
			Item,
			AttributeKey
		>;
	}
}
