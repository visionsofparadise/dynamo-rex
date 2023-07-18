import { DxReturnParams } from './InputParams';

export interface Defaults
	extends Pick<
		DxReturnParams,
		'returnConsumedCapacity' | 'returnItemCollectionMetrics' | 'returnValuesOnConditionCheckFailure'
	> {}
