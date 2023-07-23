import { ConsumedCapacity, ItemCollectionMetrics } from '@aws-sdk/client-dynamodb';
import { DxCommandGenericData, DxCommandMiddlewareData } from './command/Command';

export type DxMiddlewareHandlerDataType<DataType extends string, Data> = {
	dataType: DataType;
	data: Data;
};

export type DxMiddlewareConfigType<DataType extends string, Hook extends string, Data> = {
	hook: Hook;
	handlerData: DxMiddlewareHandlerDataType<DataType, Data>;
};

export type DxMiddlewareConfig<Data extends DxCommandGenericData = DxCommandGenericData> =
	| DxCommandMiddlewareData<Data>
	| DxMiddlewareConfigType<'ConsumedCapacity', 'ConsumedCapacity', ConsumedCapacity>
	| DxMiddlewareConfigType<'ItemCollectionMetrics', 'ItemCollectionMetrics', ItemCollectionMetrics>;

export type DxMiddlewareHook = DxMiddlewareConfig['hook'];
export type DxMiddlewareDataType = DxMiddlewareConfig['handlerData']['dataType'];

export type GetDxMiddlewareConfig<
	Hook extends DxMiddlewareHook = DxMiddlewareHook,
	Data extends DxCommandGenericData = DxCommandGenericData
> = Extract<DxMiddlewareConfig<Data>, { hook: Hook }>;

export type DxMiddlewareHandler<
	Hook extends DxMiddlewareHook = DxMiddlewareHook,
	Data extends DxCommandGenericData = DxCommandGenericData
> = {
	hook: Hook;
	handler: (
		params: GetDxMiddlewareConfig<Hook, Data>['handlerData']
	) =>
		| GetDxMiddlewareConfig<Hook, Data>['handlerData']['data']
		| Promise<GetDxMiddlewareConfig<Hook, Data>['handlerData']['data']>
		| undefined;
};

export const executeMiddleware = async <
	Hook extends DxMiddlewareHook,
	Params extends GetDxMiddlewareConfig<Hook>['handlerData']
>(
	hook: Hook,
	params: Params,
	middleware: Array<DxMiddlewareHandler>
) => {
	const recurse = async (currentParams: Params, remainingMiddleware: Array<DxMiddlewareHandler>): Promise<Params> => {
		if (remainingMiddleware.length === 0) return currentParams;

		const middleware = remainingMiddleware[0];
		const nextMiddlewares = remainingMiddleware.slice(1);

		if (middleware.hook !== hook) return recurse(currentParams, nextMiddlewares);

		const output = await middleware.handler(currentParams);

		const newParams = {
			dataType: currentParams.dataType,
			data: output || currentParams.data
		};

		return recurse(newParams as Params, nextMiddlewares);
	};

	return recurse(params, middleware);
};

export const executeMiddlewares = async <
	Hook extends DxMiddlewareHook,
	Params extends GetDxMiddlewareConfig<Hook>['handlerData']
>(
	hooks: Array<Hook>,
	params: Params,
	middleware: Array<DxMiddlewareHandler>
) => {
	const recurse = async (currentParams: Params, remainingHooks: Array<Hook>): Promise<Params> => {
		if (remainingHooks.length === 0) return currentParams;

		const hook = remainingHooks[0];
		const nextHooks = remainingHooks.slice(1);

		const newParams: Params = await executeMiddleware(hook, currentParams as any, middleware);

		return recurse(newParams, nextHooks);
	};

	return recurse(params, hooks);
};

export const appendMiddleware = (
	middlewares1: Array<DxMiddlewareHandler<DxMiddlewareHook, any>>,
	middlewares2: Array<DxMiddlewareHandler<DxMiddlewareHook, any>>
) => [...middlewares1, ...middlewares2];
