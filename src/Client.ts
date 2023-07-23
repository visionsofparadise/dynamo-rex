import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './command/Command';
import { Defaults } from './util/defaults';
import { DxMiddlewareHandler } from './Middleware';
import { ILogger } from './util/utils';

export interface DxClientConfig {
	client: DynamoDBDocumentClient;
	defaults: Defaults;
	middleware: Array<DxMiddlewareHandler>;
	logger?: ILogger;
}

export class DxClient implements DxClientConfig {
	defaults: Defaults = {};
	middleware: Array<DxMiddlewareHandler> = [];
	logger?: ILogger;

	constructor(public client: DynamoDBDocumentClient) {}

	setClient = (client?: DynamoDBDocumentClient) => {
		if (client) this.client = client;
	};

	setDefaults = (defaults?: Defaults) => {
		if (defaults) this.defaults = defaults;
	};

	setMiddleware = (middleware?: Array<DxMiddlewareHandler>) => {
		if (middleware) this.middleware = middleware;
	};

	setLogger = (logger?: ILogger) => {
		if (logger) this.logger = logger;
	};

	send = async <Command extends DxCommand<any, any, any, any, any, any, any, any>>(
		command: Command
	): Promise<ReturnType<Command['send']>> => {
		return command.send({
			client: this.client,
			defaults: this.defaults,
			middleware: this.middleware
		});
	};
}
