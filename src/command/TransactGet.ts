import { TransactGetCommand, TransactGetCommandInput, TransactGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { Get } from '@aws-sdk/client-dynamodb';

const TRANSACT_GET_COMMAND_INPUT_DATA_TYPE = 'TransactGetCommandInput' as const;
const TRANSACT_GET_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'ReadCommandInput',
	TRANSACT_GET_COMMAND_INPUT_DATA_TYPE
] as const;

const TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE = 'TransactGetCommandOutput' as const;
const TRANSACT_GET_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'ReadCommandOutput',
	TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DxTransactGetCommandInput<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<TransactGetCommandInput, 'TransactItems'>> {
	requests: (LowerCaseObjectKeys<Omit<Get, 'Key'>> & {
		key: Key;
	})[];
}

export interface DxTransactGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<TransactGetCommandOutput, 'Responses'>> {
	items: Array<Attributes>;
}

export class DxTransactGetCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof TRANSACT_GET_COMMAND_INPUT_DATA_TYPE,
	(typeof TRANSACT_GET_COMMAND_INPUT_HOOK)[number],
	DxTransactGetCommandInput<Key>,
	TransactGetCommandInput,
	typeof TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE,
	(typeof TRANSACT_GET_COMMAND_OUTPUT_HOOK)[number],
	DxTransactGetCommandOutput<Attributes>,
	TransactGetCommandOutput
> {
	constructor(input: DxTransactGetCommandInput<Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: TRANSACT_GET_COMMAND_INPUT_DATA_TYPE, hooks: TRANSACT_GET_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE, hooks: TRANSACT_GET_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<TransactGetCommandInput> => {
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
			transactItems: requests.map(request => ({ Get: upperCaseKeys(request) })),
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: TransactGetCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxTransactGetCommandOutput<Attributes>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const { responses, ...rest } = lowerCaseOutput;

		const items =
			responses
				?.map(response => {
					return response.Item as Attributes;
				})
				.filter((item): item is NonNullable<typeof item> => !!item) || [];

		const formattedOutput: DxTransactGetCommandOutput<Attributes> = {
			...rest,
			items
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

		const output = await clientConfig.client.send(new TransactGetCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
