import { AnyKeySpace } from '../KeySpace';
import {
	DxConsistentReadParam,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleConsistentReadParam,
	handleProjectionExpressionParams,
	handleReturnConsumedCapacityParam,
	handleTableNameParam
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { GetCommand, GetCommandInput, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

export interface DxGetInput
	extends DxReturnConsumedCapacityParam,
		DxProjectionExpressionParams,
		DxConsistentReadParam {}

export type DxGetOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export interface DxGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<GetCommandOutput, 'Attributes'> {
	Item?: Attributes;
}

export const dxGet = async <TorK extends Table | AnyKeySpace = AnyKeySpace>(
	TableOrKeySpace: TorK,
	keyParams: Parameters<TorK['handleInputKeyParams']>[0],
	input?: DxGetInput
): Promise<DxGetOutput<ReturnType<TorK['handleOutputItem']>>> => {
	const baseCommandInput: GetCommandInput = {
		...handleTableNameParam(TableOrKeySpace),
		Key: TableOrKeySpace.handleInputKeyParams(keyParams),
		...handleProjectionExpressionParams(input),
		...handleConsistentReadParam(input),
		...handleReturnConsumedCapacityParam(input, TableOrKeySpace.defaults)
	};

	const getCommandInput = await executeMiddlewares(
		['CommandInput', 'ReadCommandInput', 'GetCommandInput'],
		{ type: 'GetCommandInput', data: baseCommandInput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	const getCommandOutput: DxGetCommandOutput<TorK['AttributesAndIndexKeys']> = await TableOrKeySpace.client.send(
		new GetCommand(getCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'ReadCommandOutput', 'GetCommandOutput'],
		{ type: 'GetCommandOutput', data: getCommandOutput },
		TableOrKeySpace.middleware
	).then(output => output.data);

	await handleOutputMetricsMiddleware(output, TableOrKeySpace.middleware);

	const { Item } = output;

	if (!Item) throw new Error('Not Found');

	return TableOrKeySpace.handleOutputItem(Item);
};
