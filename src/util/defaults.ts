import {
	ReturnConsumedCapacity,
	ReturnItemCollectionMetrics,
	ReturnValuesOnConditionCheckFailure
} from '@aws-sdk/client-dynamodb';

export interface DxReturnParams {
	returnConsumedCapacity?: ReturnConsumedCapacity;
	returnItemCollectionMetrics?: ReturnItemCollectionMetrics;
	returnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailure;
}

export interface Defaults
	extends Pick<
		DxReturnParams,
		'returnConsumedCapacity' | 'returnItemCollectionMetrics' | 'returnValuesOnConditionCheckFailure'
	> {}

export const applyDefaults = <Input extends object>(
	input: Input,
	defaults: Defaults,
	defaultableKeys: Readonly<Array<keyof Input & keyof Defaults>>
): Input => {
	const inputDefaults = Object.fromEntries(defaultableKeys.map(key => [key, defaults[key]]));

	return {
		...inputDefaults,
		...input
	};
};
