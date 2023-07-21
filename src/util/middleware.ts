import { ConsumedCapacity, ItemCollectionMetrics } from '@aws-sdk/client-dynamodb';
import {
	BatchGetCommandInput,
	BatchWriteCommandOutput,
	DeleteCommandInput,
	GetCommandInput,
	QueryCommandInput,
	ScanCommandInput,
	TransactGetCommandInput,
	TransactWriteCommandOutput,
	UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import { DxPutCommandInput, DxPutCommandOutput } from '../command/put';
import { GenericAttributes } from '../Dx';
import { DxBatchGetCommandOutput } from '../command/batchGet';
import { DxGetCommandOutput } from '../command/get';
import { DxTransactGetCommandOutput } from '../command/transactGet';
import { DxScanCommandOutput } from '../command/scan';
import { DxQueryCommandOutput } from '../command/query';
import { DxDeleteCommandOutput } from '../command/delete';
import { DxUpdateCommandOutput } from '../command/update';
import { DxBatchWriteCommandInput } from '../command/batchWrite';
import { DxTransactWriteCommandInput } from '../command/transactWrite';

interface ReadCommandInputMap {
	BatchGetCommandInput: BatchGetCommandInput;
	GetCommandInput: GetCommandInput;
	QueryCommandInput: QueryCommandInput;
	ScanCommandInput: ScanCommandInput;
	TransactGetCommandInput: TransactGetCommandInput;
}

interface WriteCommandInputMap<Attributes extends GenericAttributes = GenericAttributes> {
	BatchWriteCommandInput: DxBatchWriteCommandInput<Attributes>;
	DeleteCommandInput: DeleteCommandInput;
	PutCommandInput: DxPutCommandInput<Attributes>;
	TransactWriteCommandInput: DxTransactWriteCommandInput<Attributes>;
	UpdateCommandInput: UpdateCommandInput;
}

interface CommandInputMap<Attributes extends GenericAttributes = GenericAttributes>
	extends ReadCommandInputMap,
		WriteCommandInputMap<Attributes> {}

interface ReadCommandOutputMap<Attributes extends GenericAttributes = GenericAttributes> {
	BatchGetCommandOutput: DxBatchGetCommandOutput<Attributes>;
	GetCommandOutput: DxGetCommandOutput<Attributes>;
	QueryCommandOutput: DxQueryCommandOutput<Attributes>;
	ScanCommandOutput: DxScanCommandOutput<Attributes>;
	TransactGetCommandOutput: DxTransactGetCommandOutput<Attributes>;
}

interface WriteCommandOutputMap<Attributes extends GenericAttributes = GenericAttributes> {
	BatchWriteCommandOutput: BatchWriteCommandOutput;
	DeleteCommandOutput: DxDeleteCommandOutput<Attributes>;
	PutCommandOutput: DxPutCommandOutput<Attributes>;
	TransactWriteCommandOutput: TransactWriteCommandOutput;
	UpdateCommandOutput: DxUpdateCommandOutput<Attributes>;
}

interface CommandOutputMap<Attributes extends GenericAttributes = GenericAttributes>
	extends ReadCommandOutputMap<Attributes>,
		WriteCommandOutputMap<Attributes> {}

interface MiddlewareInputMap<Attributes extends GenericAttributes = GenericAttributes>
	extends CommandInputMap<Attributes>,
		CommandOutputMap<Attributes> {
	ConsumedCapacity: ConsumedCapacity;
	ItemCollectionMetrics: ItemCollectionMetrics;
}

interface MiddlewareParamsBase<
	K extends keyof MiddlewareInputMap,
	Attributes extends GenericAttributes = GenericAttributes
> {
	type: K;
	data: MiddlewareInputMap<Attributes>[K];
}

type MiddlewareUniqueParamsMap<Attributes extends GenericAttributes = GenericAttributes> = {
	[x in keyof MiddlewareInputMap]: MiddlewareParamsBase<x, Attributes>;
};

export type MiddlewareUniqueParams<
	K extends keyof MiddlewareUniqueParamsMap,
	Attributes extends GenericAttributes = GenericAttributes
> = MiddlewareUniqueParamsMap<Attributes>[K];

export interface MiddlewareParamsMap<Attributes extends GenericAttributes = GenericAttributes>
	extends MiddlewareUniqueParamsMap<Attributes> {
	CommandInput: MiddlewareUniqueParams<keyof CommandInputMap, Attributes>;
	ReadCommandInput: MiddlewareUniqueParams<keyof ReadCommandInputMap, Attributes>;
	WriteCommandInput: MiddlewareUniqueParams<keyof WriteCommandInputMap, Attributes>;
	CommandOutput: MiddlewareUniqueParams<keyof CommandOutputMap, Attributes>;
	ReadCommandOutput: MiddlewareUniqueParams<keyof ReadCommandOutputMap, Attributes>;
	WriteCommandOutput: MiddlewareUniqueParams<keyof WriteCommandOutputMap, Attributes>;
}

export type MiddlewareParams<
	K extends keyof MiddlewareParamsMap,
	Attributes extends GenericAttributes = GenericAttributes
> = MiddlewareParamsMap<Attributes>[K];

export type MiddlewareHandlerType<
	N extends keyof MiddlewareParamsMap = keyof MiddlewareParamsMap,
	Attributes extends GenericAttributes = GenericAttributes
> = {
	hook: N;
	handler: (
		params: MiddlewareParamsMap<Attributes>[N]
	) =>
		| MiddlewareParamsMap<Attributes>[N]['data']
		| Promise<MiddlewareParamsMap<Attributes>[N]['data'] | undefined>
		| undefined;
};

export type MiddlewareHandlerMap<Attributes extends GenericAttributes = GenericAttributes> = {
	[x in keyof MiddlewareParamsMap]: MiddlewareHandlerType<x, Attributes>;
};

export type DxMiddlewareHook = keyof MiddlewareHandlerMap;

export type DxMiddleware<
	N extends DxMiddlewareHook = DxMiddlewareHook,
	Attributes extends GenericAttributes = GenericAttributes
> = MiddlewareHandlerMap<Attributes>[N];

const assertMiddleware: <N extends DxMiddlewareHook>(
	hook: N,
	middleware: DxMiddleware
) => asserts middleware is DxMiddleware<N> = (hook, middleware) => {
	if (middleware.hook !== hook) throw new Error();
};

export const executeMiddleware = async <N extends DxMiddlewareHook, P extends MiddlewareParams<N>>(
	hook: N,
	params: P,
	middleware: Array<DxMiddleware>
) => {
	const recurse = async (currentParams: P, remainingMiddleware: Array<DxMiddleware>): Promise<P> => {
		if (remainingMiddleware.length === 0) return currentParams;

		const middleware = remainingMiddleware[0];
		const nextMiddlewares = remainingMiddleware.slice(1);

		if (middleware.hook !== hook) return recurse(currentParams, nextMiddlewares);

		assertMiddleware(hook, middleware);

		const output = await middleware.handler(currentParams);

		const newParams: P = { ...currentParams, data: output || currentParams.data };

		return recurse(newParams, nextMiddlewares);
	};

	return recurse(params, middleware);
};

export const executeMiddlewares = async <N extends DxMiddlewareHook, P extends MiddlewareParams<N>>(
	hooks: Array<N>,
	params: P,
	middleware: Array<DxMiddleware>
) => {
	const recurse = async (currentParams: P, remainingHooks: Array<N>): Promise<P> => {
		if (remainingHooks.length === 0) return currentParams;

		const hook = remainingHooks[0];
		const nextHooks = remainingHooks.slice(1);

		const newParams = await executeMiddleware(hook, params, middleware);

		return recurse(newParams, nextHooks);
	};

	return recurse(params, hooks);
};

export const appendMiddleware = (
	middlewares1: Array<DxMiddleware<DxMiddlewareHook, any>>,
	middlewares2: Array<DxMiddleware<DxMiddlewareHook, any>>
) => [...middlewares1, ...middlewares2];

export const handleOutputMetricsMiddleware = async (
	output: {
		ConsumedCapacity?: ConsumedCapacity | Array<ConsumedCapacity>;
		ItemCollectionMetrics?: ItemCollectionMetrics | Array<ItemCollectionMetrics>;
	},
	middleware: Array<DxMiddleware>
) => {
	if (output.ConsumedCapacity)
		if (Array.isArray(output.ConsumedCapacity)) {
			for (const ConsumedCapacityItem of output.ConsumedCapacity) {
				await executeMiddleware(
					'ConsumedCapacity',
					{ type: 'ConsumedCapacity', data: ConsumedCapacityItem },
					middleware
				);
			}
		} else {
			await executeMiddleware(
				'ConsumedCapacity',
				{ type: 'ConsumedCapacity', data: output.ConsumedCapacity },
				middleware
			);
		}

	if (output.ItemCollectionMetrics)
		if (Array.isArray(output.ItemCollectionMetrics)) {
			for (const ItemCollectionMetricsItem of output.ItemCollectionMetrics) {
				await executeMiddleware(
					'ItemCollectionMetrics',
					{ type: 'ItemCollectionMetrics', data: ItemCollectionMetricsItem },
					middleware
				);
			}
		} else {
			await executeMiddleware(
				'ItemCollectionMetrics',
				{ type: 'ItemCollectionMetrics', data: output.ItemCollectionMetrics },
				middleware
			);
		}
};
