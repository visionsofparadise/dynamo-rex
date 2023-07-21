import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ILogger } from './util/utils';
import { Defaults } from './util/defaults';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { DxMiddleware, DxMiddlewareHook } from './util/middleware';
import { Table } from './Table';

export type GenericAttributes = Record<string, NativeAttributeValue>;

export interface DxConfig {
	client: DynamoDBDocumentClient;
	defaults?: Defaults;
	logger?: ILogger;
}

export class DxBase<Attributes extends GenericAttributes = GenericAttributes> {
	client: DynamoDBDocumentClient;
	middleware: Array<DxMiddleware>;
	defaults: Defaults;
	logger?: ILogger;

	constructor(public config: DxConfig, middleware: Array<DxMiddleware<DxMiddlewareHook, Attributes>> = []) {
		this.client = config.client;
		this.middleware = middleware as Array<DxMiddleware>;
		this.defaults = config.defaults || {};
		this.logger = config.logger;
	}

	get Table() {
		const ParentDx = new DxBase(this.config, this.middleware);

		return class DxTable<TableAttributes extends Attributes = Attributes> extends Table<TableAttributes> {
			constructor() {
				super(ParentDx, {} as any, ParentDx.middleware as Array<DxMiddleware<DxMiddlewareHook, TableAttributes>>);
			}
		};
	}

	Attributes!: Attributes;
}
