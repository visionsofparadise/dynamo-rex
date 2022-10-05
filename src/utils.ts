import Dx from './';
import AWS from 'aws-sdk';

type LogFunction = (message: unknown) => void;

export interface ILogger {
	warn: LogFunction;
	error: LogFunction;
	info: LogFunction;
	log: LogFunction;
}

export const constructObject = <K extends PropertyKey, V>(keys: K[], values: V[]) => {
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [P in K]: V };
};

export type RequiredAttributes<Data extends object, Attributes extends keyof Data> = Pick<Data, Attributes> &
	Partial<Omit<Data, Attributes>>;
export type OptionalAttributes<Data extends object, Attributes extends keyof Data> = Omit<Data, Attributes> &
	Partial<Pick<Data, Attributes>>;

export const randomNumber = () => Math.round(Math.random() * 1000 * 1000);

export type Assign<A, B> = Omit<A, keyof B> & B;

export type NoTableName<T> = Omit<T, 'TableName'>;

export const DocumentClient =
	process.env.INTEGRATION_TEST === 'true'
		? new AWS.DynamoDB.DocumentClient()
		: new AWS.DynamoDB.DocumentClient({
				endpoint: 'localhost:8000',
				sslEnabled: false,
				region: 'local-env'
		  });

export const TestTable = new Dx.Table({
	name: process.env.DYNAMODB_TABLE || 'test',
	client: DocumentClient,
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
		gsi1: {
			hashKey: {
				attribute: 'gsi1Pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'gsi1Sk',
				type: 'string'
			}
		},
		gsi2: {
			hashKey: {
				attribute: 'gsi2Pk',
				type: 'number'
			},
			rangeKey: {
				attribute: 'gsi2Sk',
				type: 'number'
			}
		},
		gsi3: {
			hashKey: {
				attribute: 'gsi3Pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'gsi3Sk',
				type: 'number'
			}
		},
		gsi4: {
			hashKey: {
				attribute: 'gsi4Pk',
				type: 'number'
			},
			rangeKey: {
				attribute: 'gsi4Sk',
				type: 'string'
			}
		},
		gsi5: {
			hashKey: {
				attribute: 'gsi5Pk',
				type: 'string'
			}
		},
		gsi6: {
			hashKey: {
				attribute: 'gsi6Pk',
				type: 'number'
			}
		}
	}
});
