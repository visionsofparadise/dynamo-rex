module.exports = {
	tables: [
		{
			TableName: `test`,
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' }
			],
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
				{ AttributeName: 'gsi1Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi1Sk', AttributeType: 'S' },
				{ AttributeName: 'gsi2Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi2Sk', AttributeType: 'S' }
			],
			ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
			GlobalSecondaryIndexes: [
				{
					IndexName: 'gsi1',
					KeySchema: [
						{ AttributeName: 'gsi1Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi1Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi2',
					KeySchema: [
						{ AttributeName: 'gsi2Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi2Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				}
			]
		}
	]
};
