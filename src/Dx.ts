import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ILogger } from './util/utils';
import { Defaults } from './util/defaults';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Table } from './Table';
import { DxMiddleware, appendMiddleware } from './util/middleware';

export type GenericAttributes = Record<string, NativeAttributeValue>;

export interface DxConfig {
	client: DynamoDBDocumentClient;
	defaults?: Defaults;
	logger?: ILogger;
}

export class DxBase<Attributes extends GenericAttributes = GenericAttributes> {
	client: DynamoDBDocumentClient;
	defaults: Defaults;
	logger?: ILogger;

	constructor(public config: DxConfig, public middleware: Array<DxMiddleware> = []) {
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

	addMiddleware = (newMiddleware: Array<DxMiddleware>) => {
		const middleware = appendMiddleware(this.middleware, newMiddleware);

		return new DxBase<Attributes>(this.config, middleware);
	};
}
