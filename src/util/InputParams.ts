import {
	ReturnConsumedCapacity,
	ReturnItemCollectionMetrics,
	ReturnValue,
	ReturnValuesOnConditionCheckFailure,
	Select
} from '@aws-sdk/client-dynamodb';
import { AnyKeySpace } from '../KeySpace';
import { Table } from '../Table';
import { Defaults } from './defaults';
import { GenericAttributes } from '../Dx';

export const handleTableNameParam = (TableOrKeySpace: Table | AnyKeySpace) => ({
	TableName: TableOrKeySpace.tableName
});

export interface DxExpressionAttributeParams {
	expressionAttributeNames?: Record<string, string>;
	expressionAttributeValues?: GenericAttributes;
}

export const handleExpressionAttributeParams = (input?: DxExpressionAttributeParams) => ({
	ExpressionAttributeNames: input?.expressionAttributeNames,
	ExpressionAttributeValues: input?.expressionAttributeValues
});

export interface DxUpdateExpressionParams extends DxExpressionAttributeParams {
	updateExpression?: string;
}

export const handleUpdateExpressionParams = (input?: DxUpdateExpressionParams) => ({
	UpdateExpression: input?.updateExpression,
	...handleExpressionAttributeParams(input)
});

export interface DxConditionExpressionParams extends DxExpressionAttributeParams {
	conditionExpression?: string;
}

export const handleConditionExpressionParams = (input?: DxConditionExpressionParams) => ({
	ConditionExpression: input?.conditionExpression,
	...handleExpressionAttributeParams(input)
});

export interface DxFilterExpressionParams extends DxExpressionAttributeParams {
	filterExpression?: string;
}

export const handleFilterExpressionParams = (input?: DxFilterExpressionParams) => ({
	FilterExpression: input?.filterExpression,
	...handleExpressionAttributeParams(input)
});

export interface DxProjectionExpressionParams extends Pick<DxExpressionAttributeParams, 'expressionAttributeNames'> {
	projectionExpression?: string;
}

export const handleProjectionExpressionParams = (input?: DxProjectionExpressionParams) => ({
	ProjectionExpression: input?.projectionExpression,
	ExpressionAttributeNames: input?.expressionAttributeNames
});

export interface DxListParams<Index extends string | never | undefined> {
	index?: Index;
	pageLimit?: number;
	totalLimit?: number;
	autoPage?: boolean;
	select?: Select;
}

export const handleListParams = <Index extends string | never>(input?: DxListParams<Index>) => ({
	IndexName: input?.index,
	Limit: input?.pageLimit,
	Select: input?.select
});

export interface DxConsistentReadParam {
	consistentRead?: boolean;
}

export const handleConsistentReadParam = (input?: DxConsistentReadParam) => ({
	ConsistentRead: input?.consistentRead
});

export interface DxReturnConsumedCapacityParam {
	returnConsumedCapacity?: ReturnConsumedCapacity;
}

export const handleReturnConsumedCapacityParam = (input?: DxReturnConsumedCapacityParam, defaults?: Defaults) => {
	const returnConsumedCapacity = input?.returnConsumedCapacity || defaults?.returnConsumedCapacity;

	return {
		ReturnConsumedCapacity: returnConsumedCapacity
	};
};

export type DxFullReturnValues = Extract<ReturnValue, 'ALL_NEW' | 'ALL_OLD'>;
export type DxPartialReturnValues = Extract<ReturnValue, 'UPDATED_NEW' | 'UPDATED_OLD'>;

export interface DxReturnValuesOnConditionCheckFailureParam {
	returnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailure;
}

export const handleReturnValuesOnConditionCheckFailureParam = (
	input?: DxReturnValuesOnConditionCheckFailureParam,
	defaults?: Defaults
) => {
	const returnValuesOnConditionCheckFailure =
		input?.returnValuesOnConditionCheckFailure || defaults?.returnValuesOnConditionCheckFailure;

	return {
		ReturnValuesOnConditionCheckFailure: returnValuesOnConditionCheckFailure
	};
};

export interface DxReturnParams<RV extends ReturnValue | undefined = undefined> extends DxReturnConsumedCapacityParam {
	returnValues?: RV;
	returnItemCollectionMetrics?: ReturnItemCollectionMetrics;
	returnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailure;
}

export const handleReturnParams = <RV extends ReturnValue | undefined = undefined>(
	input?: DxReturnParams<RV>,
	defaults?: Defaults
) => {
	const returnItemCollectionMetrics = input?.returnItemCollectionMetrics || defaults?.returnItemCollectionMetrics;

	const returnValuesOnConditionCheckFailure =
		input?.returnValuesOnConditionCheckFailure || defaults?.returnValuesOnConditionCheckFailure;

	return {
		ReturnValues: input?.returnValues,
		...handleReturnConsumedCapacityParam(input, defaults),
		ReturnItemCollectionMetrics: returnItemCollectionMetrics,
		ReturnValuesOnConditionCheckFailure: returnValuesOnConditionCheckFailure
	};
};
