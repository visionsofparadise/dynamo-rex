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
				{ AttributeName: 'gsi2Pk', AttributeType: 'N' },
				{ AttributeName: 'gsi2Sk', AttributeType: 'N' },
				{ AttributeName: 'gsi3Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi3Sk', AttributeType: 'N' },
				{ AttributeName: 'gsi4Pk', AttributeType: 'N' },
				{ AttributeName: 'gsi4Sk', AttributeType: 'S' },
				{ AttributeName: 'gsi5Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi6Pk', AttributeType: 'N' }
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
				},
				{
					IndexName: 'gsi3',
					KeySchema: [
						{ AttributeName: 'gsi3Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi3Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi4',
					KeySchema: [
						{ AttributeName: 'gsi4Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi4Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi5',
					KeySchema: [{ AttributeName: 'gsi5Pk', KeyType: 'HASH' }],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi6',
					KeySchema: [{ AttributeName: 'gsi6Pk', KeyType: 'HASH' }],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				}
			]
		}
	]
};
