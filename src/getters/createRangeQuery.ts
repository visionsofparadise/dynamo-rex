export const createRangeKeyQuery = (
	rangeKey: string | undefined,
	query: {
		BeginsWith?: string | number;
		Min?: string | number;
		Max?: string | number;
	}
) => {
	if (query.Max && !query.Min) {
		return {
			KeyConditionExpression: `AND ${rangeKey} < :max`,
			ExpressionAttributeValues: {
				[`:max`]: query.Max
			}
		};
	}

	if (query.Min && !query.Max) {
		return {
			KeyConditionExpression: `AND ${rangeKey} > :min`,
			ExpressionAttributeValues: {
				[`:min`]: query.Min
			}
		};
	}

	if (query.Min && query.Max) {
		return {
			KeyConditionExpression: `AND ${rangeKey} BETWEEN :min AND :max`,
			ExpressionAttributeValues: {
				[`:min`]: query.Min,
				[`:max`]: query.Max
			}
		};
	}

	if (query.BeginsWith) {
		return {
			KeyConditionExpression: `AND begins_with(${rangeKey}, :beginsWith)`,
			ExpressionAttributeValues: {
				[`:beginsWith`]: query.BeginsWith
			}
		};
	}

	return {
		KeyConditionExpression: ``,
		ExpressionAttributeValues: {}
	};
};
