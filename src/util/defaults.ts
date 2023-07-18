import {
	DxReturnConsumedCapacity,
	DxReturnItemCollectionMetrics,
	DxReturnValuesOnConditionCheckFailure
} from './InputParams';

export interface Defaults {
	returnConsumedCapacity?: DxReturnConsumedCapacity;
	returnItemCollectionMetrics?: DxReturnItemCollectionMetrics;
	returnValuesOnConditionCheckFailure?: DxReturnValuesOnConditionCheckFailure;
}
