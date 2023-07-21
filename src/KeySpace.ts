import { PrimaryIndex, Table, TableConfig, primaryIndex } from './Table';
import { ILogger, zipObject } from './util/utils';
import { Defaults } from './util/defaults';
import { DxMiddlewareHook, DxMiddleware, appendMiddleware } from './util/middleware';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DxConfig } from './Dx';
import { U } from 'ts-toolbelt';

export namespace KeySpace {
	export type GetKeyParams<K extends AnyKeySpace, Index extends K['Index']> = U.Merge<
		K['IndexKeyValueParamsMap'][Index]
	>;
}

export type AnyKeySpace = KeySpace | KeySpace<any, any, any, any>;

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
	tableName: string;
	indexConfig: TableConfig['indexes'];
	defaults: Defaults;
	logger?: ILogger;

	indexValueHandlers: IndexValueHandlers;

	constructor(
		public Table: ParentTable,
		public config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, IndexValueHandlers>,
		public middleware: Array<DxMiddleware> = []
	) {
		this.client = config.client || Table.client;
		this.tableName = Table.tableName;
		this.indexConfig = Table.config.indexes;
		this.defaults = { ...Table.defaults, ...config.defaults };
		this.logger = config.logger || Table.logger;

		this.indexValueHandlers = config.indexValueHandlers;
	}

	configure<ConfigIndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any>(
		config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>
	): KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers> {
		return new KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>(
			this.Table,
			config,
			this.middleware
		);
	}

	Attributes!: Attributes;

	Index!: Exclude<PrimaryIndex | SecondaryIndex, never>;
	PrimaryIndex!: PrimaryIndex;
	SecondaryIndex!: SecondaryIndex;

	IndexKeyMap!: {
		[x in this['Index']]: Table['IndexKeyMap'][x];
	};

	AttributesAndIndexKeys!: Attributes & U.Merge<this['IndexKeyMap'][this['Index']]>;

	IndexKeyKey!: keyof U.Merge<IndexValueHandlers[this['Index']]>;

	IndexValueParamsMap!: {
		[x in this['Index']]: {
			[y in keyof IndexValueHandlers[x]]: Parameters<IndexValueHandlers[x][y]>[0];
		};
	};

	IndexKeyValueParamsMap!: {
		[x in this['Index']]: U.Merge<this['IndexValueParamsMap'][x][keyof this['IndexValueParamsMap'][x]]>;
	};

	IndexHashKeyValueParamsMap!: {
		[x in this['Index']]: this['IndexValueParamsMap'][x][ParentTable['config']['indexes'][x]['hash']['key']];
	};

	CommandInputAttributes!: this['Attributes'];
	CommandInputKeyParams!: KeySpace.GetKeyParams<this, this['PrimaryIndex']>;
	CommandOutputAttributes!: this['Attributes'];

	handleInputItem = (item: Attributes): this['AttributesAndIndexKeys'] => this.withIndexKeys(item);
	handleInputKeyParams = (
		params: this['IndexKeyValueParamsMap'][PrimaryIndex]
	): this['IndexKeyMap'][this['PrimaryIndex']] => this.keyOf(params);
	handleOutputItem = (item: this['AttributesAndIndexKeys']): Attributes =>
		(item ? this.omitIndexKeys(item) : item) as Attributes;

	get indexes() {
		return Object.keys(this.indexValueHandlers) as Array<this['Index']>;
	}

	indexAttributeKeys<Index extends this['Index']>(index: Index) {
		return Object.keys(this.indexValueHandlers[index]) as Array<string & keyof IndexValueHandlers[Index]>;
	}

	get attributeKeys(): Array<string & keyof U.Merge<IndexValueHandlers[this['Index']]>> {
		return this.indexes.flatMap(index => this.indexAttributeKeys(index)) as Array<
			string & keyof U.Merge<IndexValueHandlers[this['Index']]>
		>;
	}

	indexAttributeValue<Index extends this['Index'], Key extends keyof this['IndexValueParamsMap'][Index]>(
		index: Index,
		key: Key,
		params: this['IndexValueParamsMap'][Index][Key]
	) {
		return this.indexValueHandlers[index][key](params);
	}

	keyOf(params: this['IndexKeyValueParamsMap'][PrimaryIndex]) {
		return this.indexKeyOf(primaryIndex, params);
	}

	indexKeyOf<Index extends this['Index']>(index: Index, params: this['IndexKeyValueParamsMap'][Index]) {
		const keys = this.indexAttributeKeys(index);

		const values = keys.map(key => this.indexAttributeValue(index, key, params as any));

		return zipObject(keys, values) as ParentTable['IndexKeyMap'][Index];
	}

	indexKeysOf(params: U.Merge<this['IndexKeyValueParamsMap'][this['Index']]>) {
		return this.indexes.reduce(
			(currentIndexKeys, index) => ({
				...currentIndexKeys,
				...this.indexKeyOf(index, params as this['IndexKeyValueParamsMap'][typeof index])
			}),
			{}
		) as U.Merge<Table.GetIndexKey<ParentTable, this['Index']>>;
	}

	withIndexKeys<Item extends U.Merge<this['IndexKeyValueParamsMap'][this['Index']]>>(
		item: Item
	): Item & U.Merge<Table.GetIndexKey<ParentTable, this['Index']>> {
		return { ...item, ...this.indexKeysOf(item) } as Item & U.Merge<Table.GetIndexKey<ParentTable, this['Index']>>;
	}

	omitIndexKeys<Item extends Partial<Attributes & U.Merge<Table.GetIndexKey<ParentTable, this['Index']>>>>(
		itemWithIndexKeys: Item
	) {
		const keyMap = new Map(this.attributeKeys.map(key => [key, true]));

		return Object.fromEntries(Object.entries(itemWithIndexKeys).filter(([key]) => !keyMap.has(key as any))) as Omit<
			Item,
			keyof U.Merge<Table.GetIndexKey<ParentTable, this['Index']>>
		>;
	}

	addMiddleware = (
		newMiddleware: Array<
			DxMiddleware<DxMiddlewareHook, Attributes & U.Merge<Table.GetIndexKey<ParentTable, this['Index']>>>
		>
	) => {
		const middleware = appendMiddleware(this.middleware, newMiddleware);

		return new KeySpace<ParentTable, Attributes, SecondaryIndex, IndexValueHandlers>(
			this.Table,
			this.config,
			middleware
		);
	};
}
