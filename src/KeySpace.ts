import { PrimaryIndex, Table, primaryIndex } from './Table';
import { zipObject } from './util/utils';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DxConfig } from './Dx';
import { A, U } from 'ts-toolbelt';
import { DxMiddlewareHandler, appendMiddleware } from './Middleware';
import { DxClient } from './Client';

export namespace KeySpace {
	export type GetKeyParams<K extends AnyKeySpace, Index extends K['Index']> = U.IntersectOf<
		Exclude<K['IndexKeyValueParamsMap'][Index], undefined>
	>;
}

export type AnyKeySpace = KeySpace<any, any, any, any>;

export type IndexValueHandlersType<
	ParentTable extends Table = Table,
	Attributes extends ParentTable['Attributes'] = ParentTable['Attributes'],
	SecondaryIndex extends ParentTable['SecondaryIndex'] | never = never
> = {
	[x in Exclude<PrimaryIndex | SecondaryIndex, never>]: {
		[y in keyof ParentTable['IndexKeyMap'][x]]: (params: Attributes) => ParentTable['IndexKeyMap'][x][y];
	};
};

export interface KeySpaceConfig<
	ParentTable extends Table = Table,
	Attributes extends ParentTable['Attributes'] = ParentTable['Attributes'],
	SecondaryIndex extends ParentTable['SecondaryIndex'] | never = never,
	IndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any
> extends Partial<DxConfig> {
	indexValueHandlers: IndexValueHandlers;
}

export class KeySpace<
	ParentTable extends Table = Table,
	Attributes extends ParentTable['Attributes'] = ParentTable['Attributes'],
	SecondaryIndex extends ParentTable['SecondaryIndex'] | never = never,
	IndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any
> {
	client: DynamoDBDocumentClient;
	dxClient: DxClient;

	tableName: string;

	indexValueHandlers: IndexValueHandlers;

	constructor(
		public Table: ParentTable,
		public config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, IndexValueHandlers>,
		middleware: Array<DxMiddlewareHandler> = []
	) {
		this.client = config.client || Table.client;
		this.dxClient = Table.dxClient;

		this.dxClient.setClient(config.client);
		this.dxClient.setDefaults({ ...this.dxClient.defaults, ...config.defaults });
		this.dxClient.setMiddleware(appendMiddleware(this.dxClient.middleware, middleware));
		this.dxClient.setLogger(config.logger);

		this.tableName = Table.config.name;
		this.indexValueHandlers = config.indexValueHandlers;
	}

	configure<ConfigIndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any>(
		config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>,
		middleware: Array<DxMiddlewareHandler> = []
	): KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers> {
		return new KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>(
			this.Table,
			config,
			middleware
		);
	}

	Attributes!: Attributes;

	Index!: Exclude<PrimaryIndex | SecondaryIndex, never>;
	PrimaryIndex!: PrimaryIndex;
	SecondaryIndex!: SecondaryIndex;

	IndexKeyMap!: {
		[x in this['Index']]: this['Table']['IndexKeyMap'][x];
	};

	AttributesAndIndexKeys!: Attributes & U.IntersectOf<this['IndexKeyMap'][this['Index']]>;

	IndexKeyKey!: keyof U.IntersectOf<IndexValueHandlers[this['Index']]>;

	IndexValueParamsMap!: {
		[x in this['Index']]: {
			[y in keyof IndexValueHandlers[x]]: A.Cast<Parameters<IndexValueHandlers[x][y]>[0], {}>;
		};
	};

	IndexKeyValueParamsMap!: {
		[x in this['Index']]: U.IntersectOf<this['IndexValueParamsMap'][x][keyof this['IndexValueParamsMap'][x]]>;
	};

	IndexHashKeyValueParamsMap!: {
		[x in this['Index']]: this['IndexValueParamsMap'][x][ParentTable['config']['indexes'][x]['hash']['key']];
	};

	get indexes(): Array<this['Index']> {
		return Object.keys(this.indexValueHandlers) as Array<this['Index']>;
	}

	indexAttributeKeys<Index extends this['Index']>(index: Index): Array<string & keyof IndexValueHandlers[Index]> {
		return Object.keys(this.indexValueHandlers[index]) as Array<string & keyof IndexValueHandlers[Index]>;
	}

	get attributeKeys(): Array<string & keyof U.IntersectOf<IndexValueHandlers[this['Index']]>> {
		return this.indexes.flatMap(index => this.indexAttributeKeys(index)) as Array<
			string & keyof U.IntersectOf<IndexValueHandlers[this['Index']]>
		>;
	}

	indexAttributeValue<Index extends this['Index'], Key extends keyof this['IndexValueParamsMap'][Index]>(
		index: Index,
		key: Key,
		params: this['IndexValueParamsMap'][Index][Key]
	): ReturnType<this['config']['indexValueHandlers'][Index][Key]> {
		return this.indexValueHandlers[index][key](params) as ReturnType<this['config']['indexValueHandlers'][Index][Key]>;
	}

	keyOf(params: this['IndexKeyValueParamsMap'][PrimaryIndex]): this['IndexKeyMap'][PrimaryIndex] {
		return this.indexKeyOf(primaryIndex, params);
	}

	indexKeyOf<Index extends this['Index']>(
		index: Index,
		params: this['IndexKeyValueParamsMap'][Index]
	): this['IndexKeyMap'][Index] {
		const keys = this.indexAttributeKeys(index);

		const values = keys.map(key => this.indexAttributeValue(index, key, params as any));

		return zipObject(keys, values) as unknown as this['IndexKeyMap'][Index];
	}

	indexKeysOf(
		params: A.Cast<U.IntersectOf<this['IndexKeyValueParamsMap'][this['Index']]>, {}>
	): A.Cast<U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>, {}> {
		return this.indexes.reduce(
			(currentIndexKeys, index) => ({
				...currentIndexKeys,
				...this.indexKeyOf(index, params as this['IndexKeyValueParamsMap'][typeof index])
			}),
			{}
		) as A.Cast<U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>, {}>;
	}

	withIndexKeys<Item extends A.Cast<U.IntersectOf<this['IndexKeyValueParamsMap'][this['Index']]>, {}>>(
		item: Item
	): Item & A.Cast<U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>, {}> {
		return { ...item, ...this.indexKeysOf(item) };
	}

	omitIndexKeys<Item extends Partial<Attributes & U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>>>(
		itemWithIndexKeys: Item
	): Omit<Item, keyof U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>> {
		const keyMap = new Map(this.attributeKeys.map(key => [key, true]));

		return Object.fromEntries(Object.entries(itemWithIndexKeys).filter(([key]) => !keyMap.has(key as any))) as Omit<
			Item,
			keyof U.IntersectOf<Table.GetIndexKey<ParentTable, this['Index']>>
		>;
	}
}
