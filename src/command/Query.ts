import { QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DxCommand } from './Command';
import { GenericAttributes } from '../Dx';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DxClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

export enum DxQueryItemsSort {
	ASCENDING = 'ascending',
	DESCENDING = 'descending'
}

const QUERY_COMMAND_INPUT_DATA_TYPE = 'QueryCommandInput' as const;
const QUERY_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', QUERY_COMMAND_INPUT_DATA_TYPE] as const;

const QUERY_COMMAND_OUTPUT_DATA_TYPE = 'QueryCommandOutput' as const;
const QUERY_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'ReadCommandOutput', QUERY_COMMAND_OUTPUT_DATA_TYPE] as const;

export interface DxQueryCommandInput<CursorKey extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<
		Omit<
			QueryCommandInput,
			'ExclusiveStartKey' | 'IndexName' | 'ScanIndexForward' | 'AttributesToGet' | 'ConditionalOperator'
		>
	> {
	index?: string | undefined;
	cursorKey?: CursorKey;
	sort?: DxQueryItemsSort;
}

export interface DxQueryCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<QueryCommandOutput, 'Items' | 'LastEvaluatedKey'>> {
	items: Array<Attributes>;
	cursorKey?: CursorKey;
}

export class DxQueryCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends DxCommand<
	typeof QUERY_COMMAND_INPUT_DATA_TYPE,
	(typeof QUERY_COMMAND_INPUT_HOOK)[number],
	DxQueryCommandInput<CursorKey>,
	QueryCommandInput,
	typeof QUERY_COMMAND_OUTPUT_DATA_TYPE,
	(typeof QUERY_COMMAND_OUTPUT_HOOK)[number],
	DxQueryCommandOutput<Attributes, CursorKey>,
	QueryCommandOutput
> {
	constructor(input: DxQueryCommandInput<CursorKey>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: QUERY_COMMAND_INPUT_DATA_TYPE, hooks: QUERY_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: QUERY_COMMAND_OUTPUT_DATA_TYPE, hooks: QUERY_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DxClientConfig): Promise<QueryCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, ['returnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const { cursorKey, index, sort, ...rest } = postMiddlewareInput;

		const formattedInput = {
			exclusiveStartKey: cursorKey,
			indexName: index,
			scanIndexForward: sort === DxQueryItemsSort.ASCENDING ? true : false,
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: QueryCommandOutput,
		{ middleware }: DxClientConfig
	): Promise<DxQueryCommandOutput<Attributes, CursorKey>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const items = (output.Items || []) as Array<Attributes>;
		const cursorKey = output.LastEvaluatedKey as CursorKey | undefined;

		const formattedOutput: DxQueryCommandOutput<Attributes, CursorKey> = {
			...lowerCaseOutput,
			items,
			cursorKey
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

		const output = await clientConfig.client.send(new QueryCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
