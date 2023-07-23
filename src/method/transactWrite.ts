import { AnyKeySpace } from '../KeySpace';
import { Table } from '../Table';
import {
	DxTransactWriteCommand,
	DxTransactWriteCommandInput,
	DxTransactWriteCommandInputConditionCheck,
	DxTransactWriteCommandInputDelete,
	DxTransactWriteCommandInputPut,
	DxTransactWriteCommandInputUpdate,
	DxTransactWriteCommandOutput
} from '../command/TransactWrite';

export interface DxTransactWriteInput extends Omit<DxTransactWriteCommandInput, 'transactItems'> {}

export type DxTransactWriteOutput = DxTransactWriteCommandOutput;

export const dxTableTransactWrite = async <T extends Table = Table>(
	Table: T,
	requests: Array<
		| Omit<DxTransactWriteCommandInputConditionCheck<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
		| Omit<DxTransactWriteCommandInputDelete<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
		| Omit<DxTransactWriteCommandInputPut<T['AttributesAndIndexKeys']>, 'tableName'>
		| Omit<DxTransactWriteCommandInputUpdate<T['IndexKeyMap'][T['PrimaryIndex']]>, 'tableName'>
	>,
	input?: DxTransactWriteInput
): Promise<DxTransactWriteOutput> =>
	Table.dxClient.send(
		new DxTransactWriteCommand<T['AttributesAndIndexKeys'], T['IndexKeyMap'][T['PrimaryIndex']]>({
			...input,
			transactItems: requests.map(request => ({ ...request, tableName: Table.tableName }))
		})
	);

export const dxTransactWrite = async <K extends AnyKeySpace = AnyKeySpace>(
	KeySpace: K,
	requests: Array<
		| Omit<DxTransactWriteCommandInputConditionCheck<Parameters<K['keyOf']>[0]>, 'tableName'>
		| Omit<DxTransactWriteCommandInputDelete<Parameters<K['keyOf']>[0]>, 'tableName'>
		| Omit<DxTransactWriteCommandInputPut<K['Attributes']>, 'tableName'>
		| Omit<DxTransactWriteCommandInputUpdate<Parameters<K['keyOf']>[0]>, 'tableName'>
	>,
	input?: DxTransactWriteInput
): Promise<DxTransactWriteOutput> =>
	dxTableTransactWrite(
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
		input
	);
