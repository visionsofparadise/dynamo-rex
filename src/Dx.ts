import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ILogger } from './util/utils';
import { Defaults } from './util/defaults';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Table } from './Table';
import { MiddlewareHandler, appendMiddleware } from './util/middleware';

export interface DxConfig {
	client: DynamoDBDocumentClient;
	defaults?: Defaults;
	logger?: ILogger;
}

export class DxBase<Attributes extends Record<string, NativeAttributeValue> = Record<string, NativeAttributeValue>> {
	client: DynamoDBDocumentClient;
	defaults: Defaults;
	logger?: ILogger;

	constructor(public config: DxConfig, public middleware: Array<MiddlewareHandler> = []) {
		this.client = config.client;
		this.defaults = config.defaults || {};
		this.logger = config.logger;
	}

	get Table() {
		const ParentDx = new DxBase(this.config, this.middleware);

		return class DxTable<TableAttributes extends Attributes = Attributes> extends Table<TableAttributes> {
			constructor() {
				super(ParentDx, {} as any, ParentDx.middleware);
			}
		};
	}

	Attributes!: Attributes;

	addMiddleware = (newMiddleware: Array<MiddlewareHandler>) => {
		const middleware = appendMiddleware(this.middleware, newMiddleware);

		return new DxBase<Attributes>(this.config, middleware);
	};
}
