import { GenericAttributes } from '../Dx';
import { PrimaryIndex, Table } from '../Table';
import {
	DxConsistentReadParam,
	DxProjectionExpressionParams,
	DxReturnConsumedCapacityParam,
	handleProjectionExpressionParams,
	handleTableNameParam
} from '../util/InputParams';
import { executeMiddlewares, handleOutputMetricsMiddleware } from '../util/middleware';
import { TransactGetCommand, TransactGetCommandInput, TransactGetCommandOutput } from '@aws-sdk/lib-dynamodb';

export interface DxTransactGetInput
	extends DxReturnConsumedCapacityParam,
		DxProjectionExpressionParams,
		DxConsistentReadParam {}

export type DxTransactGetOutput<T extends Table = Table> = Array<T['AttributesAndIndexKeys']>;

export interface DxTransactGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<TransactGetCommandOutput, 'Responses'> {
	Responses?: Array<Attributes>;
}

export const dxTransactGet = async <T extends Table = Table>(
	Table: T,
	keys: Array<T['IndexKeyMap'][PrimaryIndex]>,
	input?: DxTransactGetInput
): Promise<DxTransactGetOutput<T>> => {
	const baseCommandInput: TransactGetCommandInput = {
		TransactItems: keys.map(key => ({
			Get: {
				...handleTableNameParam(Table),
				Key: key,
				...handleProjectionExpressionParams(input)
			}
		})),
		ReturnConsumedCapacity: input?.returnConsumedCapacity || Table.defaults?.returnConsumedCapacity
	};

	const transactGetCommandInput = await executeMiddlewares(
		['CommandInput', 'ReadCommandInput', 'TransactGetCommandInput'],
		{ type: 'TransactGetCommandInput', data: baseCommandInput },
		Table.middleware
	).then(output => output.data);

	const transactGetCommandOutput: DxTransactGetCommandOutput<T['AttributesAndIndexKeys']> = await Table.client.send(
		new TransactGetCommand(transactGetCommandInput)
	);

	const output = await executeMiddlewares(
		['CommandOutput', 'ReadCommandOutput', 'TransactGetCommandOutput'],
		{ type: 'TransactGetCommandOutput', data: transactGetCommandOutput },
		Table.middleware
	).then(output => output.data);

	const { Responses, ConsumedCapacity } = output;

	await handleOutputMetricsMiddleware({ ConsumedCapacity }, Table.middleware);

	const items = (Responses || []).filter((item): item is NonNullable<typeof item> => !!item);

	return items;
};
