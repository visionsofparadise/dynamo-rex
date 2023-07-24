import { BatchGetCommand, BatchGetCommandInput, BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { KeysAndAttributes } from '@aws-sdk/client-dynamodb';

const BATCH_GET_COMMAND_INPUT_DATA_TYPE = 'BatchGetCommandInput' as const;
const BATCH_GET_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', BATCH_GET_COMMAND_INPUT_DATA_TYPE] as const;

const BATCH_GET_COMMAND_OUTPUT_DATA_TYPE = 'BatchGetCommandOutput' as const;
const BATCH_GET_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'ReadCommandOutput',
	BATCH_GET_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DxBatchGetCommandInput<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<BatchGetCommandInput, 'RequestItems'>> {
	requests: Record<
		string,
		LowerCaseObjectKeys<Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'>> & {
			keys: Key[];
		}
	>;
}

export interface DxBatchGetCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<BatchGetCommandOutput, 'Responses' | 'UnprocessedKeys'>> {
	items: Record<string, Attributes[]>;
	unprocessedRequests: Record<
		string,
		| (LowerCaseObjectKeys<Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'>> & {
				keys: Key[];
		  })
		| undefined
	>;
}

export class DxBatchGetCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof BATCH_GET_COMMAND_INPUT_DATA_TYPE,
	(typeof BATCH_GET_COMMAND_INPUT_HOOK)[number],
	DxBatchGetCommandInput<Key>,
	BatchGetCommandInput,
	typeof BATCH_GET_COMMAND_OUTPUT_DATA_TYPE,
	(typeof BATCH_GET_COMMAND_OUTPUT_HOOK)[number],
	DxBatchGetCommandOutput<Attributes, Key>,
	BatchGetCommandOutput
> {
	constructor(input: DxBatchGetCommandInput<Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: BATCH_GET_COMMAND_INPUT_DATA_TYPE, hooks: BATCH_GET_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: BATCH_GET_COMMAND_OUTPUT_DATA_TYPE, hooks: BATCH_GET_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<BatchGetCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, ['returnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const { requests, ...rest } = postMiddlewareInput;

		const formattedInput = {
			requestItems: Object.fromEntries(
				Object.entries(requests).map(([tableName, keysAndAttributes]) => [tableName, upperCaseKeys(keysAndAttributes)])
			),
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: BatchGetCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxBatchGetCommandOutput<Attributes, Key>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		console.log({ lowerCaseOutput });

		const { responses, unprocessedKeys, ...rest } = lowerCaseOutput;

		const items = Object.fromEntries(
			Object.entries(responses || {}).map(([tableName, tableItems]) => {
				const typedTableItems = (tableItems || []) as Array<Attributes>;

				return [tableName, typedTableItems];
			})
		);

		const formattedUnprocessedRequests = Object.fromEntries(
			Object.entries(unprocessedKeys || {}).map(([tableName, request]) => {
				if (!request) return [tableName, undefined];

				const { Keys, ...unprocessedRest } = request;

				const typedKeys = (Keys || []) as Array<Key>;

				return [tableName, lowerCaseKeys({ Keys: typedKeys, ...unprocessedRest })];
			})
		);

		const formattedOutput: DxBatchGetCommandOutput<Attributes, Key> = {
			...rest,
			items,
			unprocessedRequests: formattedUnprocessedRequests as DxBatchGetCommandOutput<
				Attributes,
				Key
			>['unprocessedRequests']
		};

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: formattedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.consumedCapacity) {
			for (const consumedCapacity of postMiddlewareOutput.consumedCapacity) {
				await executeMiddleware(
					'ConsumedCapacity',
					{ dataType: 'ConsumedCapacity', data: consumedCapacity },
					middleware
				);
			}
		}

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new BatchGetCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
