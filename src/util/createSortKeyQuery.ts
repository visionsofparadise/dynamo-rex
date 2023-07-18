export type DxQuickQueryOperators =
	| {
			beginsWith: string | number;
	  }
	| {
			greaterThan: string | number;
			lessThan: string | number;
	  }
	| {
			greaterThan: string | number;
	  }
	| {
			lessThan: string | number;
	  }
	| {}
	| undefined;

export const createQueryQuickSort = (sortKey?: string | undefined, operators?: DxQuickQueryOperators) => {
	if (operators && sortKey) {
		if ('greaterThan' in operators && 'lessThan' in operators) {
			return {
				KeyConditionExpression: `AND ${sortKey} BETWEEN :min AND :max`,
				ExpressionAttributeValues: {
					[`:min`]: operators.greaterThan,
					[`:max`]: operators.lessThan
				}
			};
		}

		if ('lessThan' in operators) {
			return {
				KeyConditionExpression: `AND ${sortKey} < :max`,
				ExpressionAttributeValues: {
					[`:max`]: operators.lessThan
				}
			};
		}

		if ('greaterThan' in operators) {
			return {
				KeyConditionExpression: `AND ${sortKey} > :min`,
				ExpressionAttributeValues: {
					[`:min`]: operators.greaterThan
				}
			};
		}

		if ('beginsWith' in operators) {
			return {
				KeyConditionExpression: `AND begins_with(${sortKey}, :beginsWith)`,
				ExpressionAttributeValues: {
					[`:beginsWith`]: operators.beginsWith
				}
			};
		}
	}

	return {
		KeyConditionExpression: ``,
		ExpressionAttributeValues: {}
	};
};
