import { TransactWriteCommand, TransactWriteCommandInput, TransactWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { ConditionCheck, Delete, Put, Update } from '@aws-sdk/client-dynamodb';

const TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE = 'TransactWriteCommandInput' as const;
const TRANSACT_WRITE_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'WriteCommandInput',
	TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE
] as const;

const TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE = 'TransactWriteCommandOutput' as const;
const TRANSACT_WRITE_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'WriteCommandOutput',
	TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DxTransactWriteCommandInputConditionCheck<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<ConditionCheck, 'Key'>> {
	type: 'conditionCheck';
	key: Key;
}

export interface DxTransactWriteCommandInputPut<Attributes extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<Put, 'Item'>> {
	type: 'put';
	item: Attributes;
}

export interface DxTransactWriteCommandInputDelete<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<Delete, 'Key'>> {
	type: 'delete';
	key: Key;
}

export interface DxTransactWriteCommandInputUpdate<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<Update, 'Key'>> {
	type: 'update';
	key: Key;
}

export interface DxTransactWriteCommandInput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<TransactWriteCommandInput, 'RequestItems'>> {
	transactItems: Array<
		| DxTransactWriteCommandInputConditionCheck<Key>
		| DxTransactWriteCommandInputPut<Attributes>
		| DxTransactWriteCommandInputDelete<Key>
		| DxTransactWriteCommandInputUpdate<Key>
	>;
}

export interface DxTransactWriteCommandOutput extends LowerCaseObjectKeys<TransactWriteCommandOutput> {}

export class DxTransactWriteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE,
	(typeof TRANSACT_WRITE_COMMAND_INPUT_HOOK)[number],
	DxTransactWriteCommandInput<Attributes, Key>,
	TransactWriteCommandInput,
	typeof TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof TRANSACT_WRITE_COMMAND_OUTPUT_HOOK)[number],
	DxTransactWriteCommandOutput,
	TransactWriteCommandOutput
> {
	constructor(input: DxTransactWriteCommandInput<Attributes, Key>) {
		super(input);
	}

	inputMiddlewareConfig = {
		dataType: TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE,
		hooks: TRANSACT_WRITE_COMMAND_INPUT_HOOK
	};
	outputMiddlewareConfig = {
		dataType: TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE,
		hooks: TRANSACT_WRITE_COMMAND_OUTPUT_HOOK
	};

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<TransactWriteCommandInput> => {
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

		const { transactItems, ...rest } = postMiddlewareInput;

		const formattedInput = {
			transactItems: transactItems.map(request => {
				if (request.type === 'conditionCheck') {
					return {
						ConditionCheck: upperCaseKeys(request)
					};
				}

				if (request.type === 'put') {
					return {
						Put: upperCaseKeys(request)
					};
				}

				if (request.type === 'delete') {
					return {
						Delete: upperCaseKeys(request)
					};
				}

				if (request.type === 'update') {
					return {
						Update: upperCaseKeys(request)
					};
				}

				return {};
			}),
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: TransactWriteCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxTransactWriteCommandOutput> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: lowerCaseOutput
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

		const output = await clientConfig.client.send(new TransactWriteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
