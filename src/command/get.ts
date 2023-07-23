import { GetCommand, GetCommandInput, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const GET_COMMAND_INPUT_DATA_TYPE = 'GetCommandInput' as const;
const GET_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', GET_COMMAND_INPUT_DATA_TYPE] as const;

const GET_COMMAND_OUTPUT_DATA_TYPE = 'GetCommandOutput' as const;
const GET_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'ReadCommandOutput', GET_COMMAND_OUTPUT_DATA_TYPE] as const;

export interface DxGetCommandInput<Key extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<GetCommandInput, 'Key'>> {
	key: Key;
}

export interface DxGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<GetCommandOutput, 'Item'>> {
	item: Attributes;
}

export class DxGetCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof GET_COMMAND_INPUT_DATA_TYPE,
	(typeof GET_COMMAND_INPUT_HOOK)[number],
	DxGetCommandInput<Key>,
	GetCommandInput,
	typeof GET_COMMAND_OUTPUT_DATA_TYPE,
	(typeof GET_COMMAND_OUTPUT_HOOK)[number],
	DxGetCommandOutput<Attributes>,
	GetCommandOutput
> {
	constructor(input: DxGetCommandInput<Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: GET_COMMAND_INPUT_DATA_TYPE, hooks: GET_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: GET_COMMAND_OUTPUT_DATA_TYPE, hooks: GET_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<GetCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, ['returnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const upperCaseInput = upperCaseKeys(postMiddlewareInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: GetCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxGetCommandOutput<Attributes>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const item = output.Item as Attributes | undefined;

		if (!item) throw new Error('Item Not Found');

		const formattedOutput: DxGetCommandOutput<Attributes> = {
			...lowerCaseOutput,
			item
		};

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: formattedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.consumedCapacity)
			await executeMiddleware(
				'ConsumedCapacity',
				{ dataType: 'ConsumedCapacity', data: postMiddlewareOutput.consumedCapacity },
				middleware
			);

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new GetCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
