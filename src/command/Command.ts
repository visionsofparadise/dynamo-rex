import { DxPutCommand } from './Put';
import { DxGetCommand } from './Get';
import { DxMiddlewareConfigType } from '../Middleware';
import { DxUpdateCommand } from './Update';
import { DxClientConfig } from '../Client';
import { DxDeleteCommand } from './Delete';
import { DxQueryCommand } from './Query';
import { DxScanCommand } from './Scan';
import { DxBatchGetCommand } from './BatchGet';
import { DxBatchWriteCommand } from './BatchWrite';
import { DxTransactGetCommand } from './TransactGet';
import { DxTransactWriteCommand } from './TransactWrite';
import { GenericAttributes } from '../Dx';

export interface DxCommandGenericData {
	Attributes: GenericAttributes;
	Key: GenericAttributes;
	CursorKey: GenericAttributes;
}

export type DxCommandMap<Data extends DxCommandGenericData = DxCommandGenericData> = {
	BatchGetCommand: DxBatchGetCommand<Data['Attributes'], Data['Key']>;
	BatchWriteCommand: DxBatchWriteCommand<Data['Attributes'], Data['Key']>;
	DeleteCommand: DxDeleteCommand<Data['Attributes'], Data['Key']>;
	GetCommand: DxGetCommand<Data['Attributes'], Data['Key']>;
	PutCommand: DxPutCommand<Data['Attributes']>;
	QueryCommand: DxQueryCommand<Data['Attributes'], Data['CursorKey']>;
	ScanCommand: DxScanCommand<Data['Attributes'], Data['CursorKey']>;
	TransactGetCommand: DxTransactGetCommand<Data['Attributes'], Data['Key']>;
	TransactWriteCommand: DxTransactWriteCommand<Data['Attributes'], Data['Key']>;
	UpdateCommand: DxUpdateCommand<Data['Attributes'], Data['Key']>;
};

export type DxCommandMiddlewareData<Data extends DxCommandGenericData = DxCommandGenericData> = {
	[x in keyof DxCommandMap]:
		| {
				[y in DxCommandMap[x]['inputMiddlewareConfig']['hooks'][number]]: DxMiddlewareConfigType<
					DxCommandMap[x]['inputMiddlewareConfig']['dataType'],
					y,
					DxCommandMap<Data>[x]['Input']
				>;
		  }[DxCommandMap[x]['inputMiddlewareConfig']['hooks'][number]]
		| {
				[y in DxCommandMap[x]['outputMiddlewareConfig']['hooks'][number]]: DxMiddlewareConfigType<
					DxCommandMap[x]['outputMiddlewareConfig']['dataType'],
					y,
					DxCommandMap<Data>[x]['Output']
				>;
		  }[DxCommandMap[x]['outputMiddlewareConfig']['hooks'][number]];
}[keyof DxCommandMap];

export abstract class DxCommand<
	InputDataType extends string,
	InputHook extends string,
	Input extends object,
	BaseInput extends object,
	OutputDataType extends string,
	OutputHook extends string,
	Output extends object,
	BaseOutput extends object
> {
	constructor(public readonly input: Input) {}

	Input!: Input;
	Output!: Output;

	abstract inputMiddlewareConfig: { dataType: InputDataType; hooks: Readonly<Array<InputHook>> };
	abstract outputMiddlewareConfig: { dataType: OutputDataType; hooks: Readonly<Array<OutputHook>> };

	abstract handleInput: (clientConfig: DxClientConfig) => Promise<BaseInput>;
	abstract handleOutput: (output: BaseOutput, clientConfig: DxClientConfig) => Promise<Output>;

	abstract send: (clientConfig: DxClientConfig) => Promise<Output>;
}
