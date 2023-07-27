import { AnyKeySpace } from '../KeySpace';
import { Table } from '../Table';
import {
	DkTransactWriteCommand,
	DkTransactWriteCommandInput,
	DkTransactWriteCommandInputConditionCheck,
	DkTransactWriteCommandInputDelete,
	DkTransactWriteCommandInputPut,
	DkTransactWriteCommandInputUpdate,
	DkTransactWriteCommandOutput
} from '../command/TransactWrite';
import { DkClient } from '../Client';

export interface TransactWriteItemsInput extends Omit<DkTransactWriteCommandInput, 'requests'> {}

export type TransactWriteItemsOutput = DkTransactWriteCommandOutput;

export const transactWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<
		| Omit<DkTransactWriteCommandInputConditionCheck<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
		| Omit<DkTransactWriteCommandInputDelete<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
		| Omit<DkTransactWriteCommandInputPut<T['Attributes']>, 'tableName'>
		| Omit<DkTransactWriteCommandInputUpdate<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
	>,
	input?: TransactWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<TransactWriteItemsOutput> =>
	dkClient.send(
		new DkTransactWriteCommand<T['Attributes'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			requests: requests.map(request => ({ ...request, tableName: Table.tableName }))
		})
	);

export const transactWriteItems = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	requests: Array<
		| Omit<DkTransactWriteCommandInputConditionCheck<Parameters<K['keyOf']>[0]>, 'tableName'>
		| Omit<DkTransactWriteCommandInputDelete<Parameters<K['keyOf']>[0]>, 'tableName'>
		| Omit<DkTransactWriteCommandInputPut<K['Attributes']>, 'tableName'>
		| Omit<DkTransactWriteCommandInputUpdate<Parameters<K['keyOf']>[0]>, 'tableName'>
	>,
	input?: TransactWriteItemsInput
): Promise<TransactWriteItemsOutput> =>
	transactWriteTableItems(
		KeySpace.Table,
		requests.map(request => {
			if (request.type === 'put') {
				return {
					...request,
					item: KeySpace.withIndexKeys(request.item)
				};
			}

			return {
				...request,
				key: KeySpace.keyOf(request.key as any)
			};
		}),
		input,
		KeySpace.dkClient
	);
