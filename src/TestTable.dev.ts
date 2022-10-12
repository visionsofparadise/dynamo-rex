import { DynamoDB } from 'aws-sdk';
import Dx from '.';

export const DocumentClient =
	process.env.INTEGRATION_TEST === 'true'
		? new DynamoDB.DocumentClient()
		: new DynamoDB.DocumentClient({
				endpoint: 'localhost:8000',
				sslEnabled: false,
				region: 'local-env'
		  });

export const TestTable = new Dx.Table({
	name: process.env.DYNAMODB_TABLE || 'test',
	client: DocumentClient,
	logger: console,
	primaryIndex: 'primary',
	indexes: {
		primary: {
			hashKey: {
				attribute: 'pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'sk',
				type: 'string'
			}
		},
		gsi0: {
			hashKey: {
				attribute: 'gsi0Pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'gsi0Sk',
				type: 'string'
			}
		},
		gsi1: {
			hashKey: {
				attribute: 'gsi1Pk',
				type: 'number'
			},
			rangeKey: {
				attribute: 'gsi1Sk',
				type: 'number?'
			},
			project: []
		},
		gsi2: {
			hashKey: {
				attribute: 'gsi2Pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'gsi2Sk',
				type: 'number'
			},
			project: ['testString']
		},
		gsi3: {
			hashKey: {
				attribute: 'gsi3Pk',
				type: 'number'
			},
			rangeKey: {
				attribute: 'gsi3Sk',
				type: 'string?'
			}
		},
		gsi4: {
			hashKey: {
				attribute: 'gsi4Pk',
				type: 'string'
			}
		},
		gsi5: {
			hashKey: {
				attribute: 'gsi5Pk',
				type: 'number'
			}
		}
	}
});
