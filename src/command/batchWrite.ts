import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const BATCH_WRITE_COMMAND_INPUT_DATA_TYPE = 'BatchWriteCommandInput' as const;
const BATCH_WRITE_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'WriteCommandInput',
	BATCH_WRITE_COMMAND_INPUT_DATA_TYPE
] as const;

const BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE = 'BatchWriteCommandOutput' as const;
const BATCH_WRITE_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'WriteCommandOutput',
	BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DxBatchWriteCommandInput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<BatchWriteCommandInput, 'RequestItems'>> {
	requestItems: Record<string, Array<{ put: Attributes } | { delete: Key }>>;
}

export interface DxBatchWriteCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<BatchWriteCommandOutput, 'UnprocessedItems'>> {
	unprocessedItems: Record<string, Array<{ put: Attributes } | { delete: Key }>>;
}

export class DxBatchWriteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof BATCH_WRITE_COMMAND_INPUT_DATA_TYPE,
	(typeof BATCH_WRITE_COMMAND_INPUT_HOOK)[number],
	DxBatchWriteCommandInput<Attributes, Key>,
	BatchWriteCommandInput,
	typeof BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof BATCH_WRITE_COMMAND_OUTPUT_HOOK)[number],
	DxBatchWriteCommandOutput<Attributes, Key>,
	BatchWriteCommandOutput
> {
	constructor(input: DxBatchWriteCommandInput<Attributes, Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: BATCH_WRITE_COMMAND_INPUT_DATA_TYPE, hooks: BATCH_WRITE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE, hooks: BATCH_WRITE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<BatchWriteCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, [
			'returnConsumedCapacity',
			'returnItemCollectionMetrics'
		]);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const { requestItems, ...rest } = postMiddlewareInput;

		const formattedInput = {
			requestItems: Object.fromEntries(
				Object.entries(requestItems).map(([tableName, requests]) => {
					const formattedRequests = requests.map(request => {
						if ('put' in request) {
							return {
								PutRequest: {
									Item: request.put
								}
							};
						}

						return {
							DeleteRequest: {
								Key: request.delete
							}
						};
					});

					return [tableName, formattedRequests];
				})
			),
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: BatchWriteCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxBatchWriteCommandOutput<Attributes, Key>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const { unprocessedItems, ...rest } = lowerCaseOutput;

		const formattedUnprocessedItems = Object.fromEntries(
			Object.entries(unprocessedItems || {}).map(([tableName, requests]) => {
				const formattedRequests = requests.map(request => {
					if (request.PutRequest) {
						const item = request.PutRequest.Item as Attributes;

						return {
							put: item
						};
					}

					const key = request.DeleteRequest?.Key as Key;

					return {
						delete: key
					};
				});

				return [tableName, formattedRequests];
			})
		);

		const formattedOutput: DxBatchWriteCommandOutput<Attributes, Key> = {
			...rest,
			unprocessedItems: formattedUnprocessedItems
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

		if (postMiddlewareOutput.itemCollectionMetrics) {
			await executeMiddleware(
				'ItemCollectionMetrics',
				{ dataType: 'ItemCollectionMetrics', data: postMiddlewareOutput.itemCollectionMetrics },
				middleware
			);
		}

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new BatchWriteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
