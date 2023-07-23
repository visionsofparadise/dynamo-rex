import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Table } from './Table';
import { DxMiddlewareHandler } from './Middleware';
import { DxClient, DxClientConfig } from './Client';

export type GenericAttributes = Record<string, NativeAttributeValue>;

export interface DxConfig extends Partial<DxClientConfig> {
	client: DynamoDBDocumentClient;
}

export class DxBase<Attributes extends GenericAttributes = GenericAttributes> {
	client: DynamoDBDocumentClient;
	dxClient: DxClient;

	constructor(public config: DxConfig, middleware: Array<DxMiddlewareHandler> = []) {
		this.client = config.client;
		this.dxClient = new DxClient(this.client);

		this.dxClient.setDefaults(config.defaults);
		this.dxClient.setMiddleware(middleware);
		this.dxClient.setLogger(config.logger);
	}

	get Table() {
		const ParentDx = new DxBase(this.config, this.dxClient.middleware);

		return class DxTable<TableAttributes extends Attributes = Attributes> extends Table<TableAttributes> {
			constructor() {
				super(ParentDx, {} as any);
			}
		};
	}

	Attributes!: Attributes;
}
