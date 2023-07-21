import {
	ReturnConsumedCapacity,
	ReturnItemCollectionMetrics,
	ReturnValue,
	ReturnValuesOnConditionCheckFailure,
	Select
} from '@aws-sdk/client-dynamodb';
import { AnyKeySpace } from '../KeySpace';
import { Table } from '../Table';
import { GenericAttributes } from '../Dx';

export const handleTableNameParam = (Table: Table) => ({
	TableName: Table.config.name
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

export const handleReturnConsumedCapacityParam = (KeySpace: AnyKeySpace, input?: DxReturnConsumedCapacityParam) => {
	const returnConsumedCapacity =
		input?.returnConsumedCapacity ||
		KeySpace.defaults?.returnConsumedCapacity ||
		KeySpace.Table.defaults?.returnConsumedCapacity;

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
	Table: Table,
	input?: DxReturnValuesOnConditionCheckFailureParam
) => {
	const returnValuesOnConditionCheckFailure =
		input?.returnValuesOnConditionCheckFailure || Table.defaults?.returnValuesOnConditionCheckFailure;

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
	KeySpace: AnyKeySpace,
	input?: DxReturnParams<RV>
) => {
	const returnItemCollectionMetrics =
		input?.returnItemCollectionMetrics ||
		KeySpace.defaults?.returnItemCollectionMetrics ||
		KeySpace.Table.defaults?.returnItemCollectionMetrics;

	const returnValuesOnConditionCheckFailure =
		input?.returnValuesOnConditionCheckFailure ||
		KeySpace.defaults?.returnValuesOnConditionCheckFailure ||
		KeySpace.Table.defaults?.returnValuesOnConditionCheckFailure;

	return {
		ReturnValues: input?.returnValues,
		...handleReturnConsumedCapacityParam(KeySpace, input),
		ReturnItemCollectionMetrics: returnItemCollectionMetrics,
		ReturnValuesOnConditionCheckFailure: returnValuesOnConditionCheckFailure
	};
};
