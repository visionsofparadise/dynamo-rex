import {
	ReturnConsumedCapacity,
	ReturnItemCollectionMetrics,
	ReturnValue,
	ReturnValuesOnConditionCheckFailure
} from '@aws-sdk/client-dynamodb';
import { KeySpace } from '../KeySpace';
import { Table } from '../Table';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { marshallValues } from './marshallValues';

export const handleTableNameParam = (Table: Table) => ({
	TableName: Table.config.name
});

export interface DxExpressionAttributeParams {
	expressionAttributeNames?: Record<string, string>;
	expressionAttributeValues?: Record<string, NativeAttributeValue>;
}

export const handleExpressionAttributeParams = (input?: DxExpressionAttributeParams) => ({
	ExpressionAttributeNames: input?.expressionAttributeNames,
	ExpressionAttributeValues: marshallValues(input?.expressionAttributeValues)
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

export enum DxReturnConsumedCapacity {
	INDEXES = 'indexes',
	TOTAL = 'total',
	NONE = 'none'
}

export const ReturnConsumedCapacityValueMap = {
	[DxReturnConsumedCapacity.INDEXES]: ReturnConsumedCapacity.INDEXES,
	[DxReturnConsumedCapacity.TOTAL]: ReturnConsumedCapacity.TOTAL,
	[DxReturnConsumedCapacity.NONE]: ReturnConsumedCapacity.NONE
};

export interface DxReturnConsumedCapacityParam {
	returnConsumedCapacity?: DxReturnConsumedCapacity;
}

export const handleReturnConsumedCapacityParam = (KeySpace: KeySpace, input?: DxReturnConsumedCapacityParam) => {
	const returnConsumedCapacity =
		input?.returnConsumedCapacity ||
		KeySpace.defaults?.returnConsumedCapacity ||
		KeySpace.Table.defaults?.returnConsumedCapacity;

	return {
		ReturnConsumedCapacity: returnConsumedCapacity ? ReturnConsumedCapacityValueMap[returnConsumedCapacity] : undefined
	};
};

export type DxFullReturnValues = 'allNew' | 'allOld';
export type DxPartialReturnValues = 'updatedNew' | 'updatedOld';
export type DxReturnValues = DxFullReturnValues | DxPartialReturnValues | 'none' | undefined;

const RETURN_VALUES_MAP = {
	allNew: ReturnValue.ALL_NEW,
	allOld: ReturnValue.ALL_OLD,
	updatedNew: ReturnValue.UPDATED_NEW,
	updatedOld: ReturnValue.UPDATED_OLD,
	none: ReturnValue.NONE
};

export enum DxReturnItemCollectionMetrics {
	SIZE = 'size',
	NONE = 'none'
}

export const ReturnItemCollectionMetricsValueMap = {
	[DxReturnItemCollectionMetrics.SIZE]: ReturnItemCollectionMetrics.SIZE,
	[DxReturnItemCollectionMetrics.NONE]: ReturnItemCollectionMetrics.NONE
};

export enum DxReturnValuesOnConditionCheckFailure {
	ALL_OLD = 'allOld',
	NONE = 'none'
}

export const ReturnValuesOnConditionCheckFailureValueMap = {
	[DxReturnValuesOnConditionCheckFailure.ALL_OLD]: ReturnValuesOnConditionCheckFailure.ALL_OLD,
	[DxReturnValuesOnConditionCheckFailure.NONE]: ReturnValuesOnConditionCheckFailure.NONE
};

export interface DxReturnParams<RV extends DxReturnValues = never> extends DxReturnConsumedCapacityParam {
	returnValues?: RV;
	returnItemCollectionMetrics?: DxReturnItemCollectionMetrics;
	returnValuesOnConditionCheckFailure?: DxReturnValuesOnConditionCheckFailure;
}

export const handleReturnParams = <RV extends DxReturnValues = never>(
	KeySpace: KeySpace,
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
		ReturnValues: input?.returnValues ? RETURN_VALUES_MAP[input.returnValues] : undefined,
		...handleReturnConsumedCapacityParam(KeySpace, input),
		ReturnItemCollectionMetrics: returnItemCollectionMetrics
			? ReturnItemCollectionMetricsValueMap[returnItemCollectionMetrics]
			: undefined,
		ReturnValuesOnConditionCheckFailure: returnValuesOnConditionCheckFailure
			? ReturnValuesOnConditionCheckFailureValueMap[returnValuesOnConditionCheckFailure]
			: undefined
	};
};
