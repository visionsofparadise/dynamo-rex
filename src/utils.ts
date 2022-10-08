import { DynamoDB } from 'aws-sdk';
import Dx from './';

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

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

export const wait = async (ms: number) =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

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
			}
		},
		gsi2: {
			hashKey: {
				attribute: 'gsi2Pk',
				type: 'string'
			},
			rangeKey: {
				attribute: 'gsi2Sk',
				type: 'number'
			}
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
