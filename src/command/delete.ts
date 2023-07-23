import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { ReturnValuesAttributes, assertReturnValuesAttributes } from '../util/returnValuesAttributes';

const DELETE_COMMAND_INPUT_DATA_TYPE = 'DeleteCommandInput' as const;
const DELETE_COMMAND_INPUT_HOOK = ['CommandInput', 'WriteCommandInput', DELETE_COMMAND_INPUT_DATA_TYPE] as const;

const DELETE_COMMAND_OUTPUT_DATA_TYPE = 'DeleteCommandOutput' as const;
const DELETE_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'WriteCommandOutput', DELETE_COMMAND_OUTPUT_DATA_TYPE] as const;

export type DxDeleteReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DxDeleteCommandInput<
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxDeleteReturnValues = DxDeleteReturnValues
> extends LowerCaseObjectKeys<Omit<DeleteCommandInput, 'Key'>> {
	key: Key;
	returnValues?: ReturnValues;
}

export interface DxDeleteCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxDeleteReturnValues = DxDeleteReturnValues
> extends LowerCaseObjectKeys<Omit<DeleteCommandOutput, 'Attributes'>> {
	attributes: ReturnValuesAttributes<Attributes, ReturnValues>;
}

export class DxDeleteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxDeleteReturnValues = DxDeleteReturnValues
> extends DxCommand<
	typeof DELETE_COMMAND_INPUT_DATA_TYPE,
	(typeof DELETE_COMMAND_INPUT_HOOK)[number],
	DxDeleteCommandInput<Key, ReturnValues>,
	DeleteCommandInput,
	typeof DELETE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof DELETE_COMMAND_OUTPUT_HOOK)[number],
	DxDeleteCommandOutput<Attributes, ReturnValues>,
	DeleteCommandOutput
> {
	constructor(input: DxDeleteCommandInput<Key, ReturnValues>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: DELETE_COMMAND_INPUT_DATA_TYPE, hooks: DELETE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: DELETE_COMMAND_OUTPUT_DATA_TYPE, hooks: DELETE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<DeleteCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, [
			'returnConsumedCapacity',
			'returnItemCollectionMetrics',
			'returnValuesOnConditionCheckFailure'
		]);

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
		output: DeleteCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxDeleteCommandOutput<Attributes, ReturnValues>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const attributes = output.Attributes as Attributes | undefined;

		assertReturnValuesAttributes(attributes, this.input.returnValues);

		const formattedOutput: DxDeleteCommandOutput<Attributes, ReturnValues> = {
			...lowerCaseOutput,
			attributes
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

		if (postMiddlewareOutput.itemCollectionMetrics)
			await executeMiddleware(
				'ItemCollectionMetrics',
				{ dataType: 'ItemCollectionMetrics', data: postMiddlewareOutput.itemCollectionMetrics },
				middleware
			);

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DxClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new DeleteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
