import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../Dx';
import { ReturnValuesAttributes, assertReturnValuesAttributes } from '../util/returnValuesAttributes';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const UPDATE_COMMAND_INPUT_DATA_TYPE = 'UpdateCommandInput' as const;
const UPDATE_COMMAND_INPUT_HOOK = ['CommandInput', 'WriteCommandInput', UPDATE_COMMAND_INPUT_DATA_TYPE] as const;

const UPDATE_COMMAND_OUTPUT_DATA_TYPE = 'UpdateCommandOutput' as const;
const UPDATE_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'WriteCommandOutput', UPDATE_COMMAND_OUTPUT_DATA_TYPE] as const;

export type DxUpdateReturnValues = ReturnValue | undefined;

export interface DxUpdateCommandInput<
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxUpdateReturnValues = DxUpdateReturnValues
> extends LowerCaseObjectKeys<
		Omit<UpdateCommandInput, 'Key' | 'ReturnValues' | 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'>
	> {
	key: Key;
	returnValues?: ReturnValues;
}

export interface DxUpdateCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxUpdateReturnValues = DxUpdateReturnValues
> extends LowerCaseObjectKeys<Omit<UpdateCommandOutput, 'Attributes'>> {
	attributes: ReturnValuesAttributes<Attributes, ReturnValues>;
}

export class DxUpdateCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DxUpdateReturnValues = DxUpdateReturnValues
> extends DxCommand<
	typeof UPDATE_COMMAND_INPUT_DATA_TYPE,
	(typeof UPDATE_COMMAND_INPUT_HOOK)[number],
	DxUpdateCommandInput<Key, ReturnValues>,
	UpdateCommandInput,
	typeof UPDATE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof UPDATE_COMMAND_OUTPUT_HOOK)[number],
	DxUpdateCommandOutput<Attributes, ReturnValues>,
	UpdateCommandOutput
> {
	constructor(input: DxUpdateCommandInput<Key, ReturnValues>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: UPDATE_COMMAND_INPUT_DATA_TYPE, hooks: UPDATE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: UPDATE_COMMAND_OUTPUT_DATA_TYPE, hooks: UPDATE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<UpdateCommandInput> => {
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
		output: UpdateCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxUpdateCommandOutput<Attributes, ReturnValues>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const attributes = output.Attributes as Attributes | undefined;

		assertReturnValuesAttributes(attributes, this.input.returnValues);

		const formattedOutput: DxUpdateCommandOutput<Attributes, ReturnValues> = {
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

		const output = await clientConfig.client.send(new UpdateCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
