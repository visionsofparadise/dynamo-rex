import { Constructor, ILogger, UnionToIntersection } from '../utils';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ISIdxCfg, Item, IdxAFns } from '../Item/Item';
import { getters } from '../getters/getters';
import { putFn } from './put2';
import { getFn } from './get';
import { createFn } from './create';
import { updateFn } from './update';
import { scanFn } from './scan';
import { deleteFn } from './delete';
import { queryFn } from './query';
import { resetFn } from './reset';
import { AttributeType, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDB } from 'aws-sdk';
import { A } from 'ts-toolbelt';

export type IdxAT = string | number | undefined;

export type IdxHKATL = 'string' | 'number';
export type IdxRKATL = IdxHKATL | 'string?' | 'number?';

export type IdxP = never | never[] | Readonly<string[]>;

export interface PIdxCfg {
	hashKey: {
		attribute: string;
		type: IdxHKATL;
	};
	rangeKey?: {
		attribute: string;
		type: IdxRKATL;
	};
}

export interface IdxCfg extends PIdxCfg {
	project?: IdxP;
}

export interface MCfg {
	name: string;
	client: DocumentClient;
	logger?: ILogger;
}

export interface Cfg extends MCfg {
	primaryIndexName: keyof Cfg['indexes'];
	indexes: {
		[x: string]: IdxCfg;
	};
}

export type IdxATLToType<TIdxATL extends IdxRKATL> = TIdxATL extends 'string'
	? string
	: TIdxATL extends 'string?'
	? string | undefined
	: TIdxATL extends 'number'
	? number
	: TIdxATL extends 'number?'
	? number | undefined
	: string | number;

export type IdxKey<TIdxCfg extends PIdxCfg> = {
	[x in TIdxCfg['hashKey']['attribute']]: IdxATLToType<TIdxCfg['hashKey']['type']>;
} & (TIdxCfg['rangeKey'] extends {
	attribute: string;
	type: IdxRKATL;
}
	? {
			[x in TIdxCfg['rangeKey']['attribute']]: IdxATLToType<TIdxCfg['rangeKey']['type']>;
	  }
	: {});

export type IdxKeys<Idx extends CfgIdxN<TCfg>, TCfg extends Cfg = Cfg> = UnionToIntersection<
	CfgXIdxKeyM<Idx, TCfg>[Idx]
> & {};

export type CfgIdxN<TCfg extends Cfg> = TCfg extends { indexes: { [x in infer Idx]: PIdxCfg } } ? Idx : never;

export type CfgIdxKeyM<TCfg extends Cfg> = TCfg extends { indexes: { [x in infer Idx]: PIdxCfg } }
	? { [x in Idx]: IdxKey<TCfg['indexes'][x]> }
	: never;

export type CfgXIdxKeyM<XIdx extends CfgIdxN<TCfg>, TCfg extends Cfg> = { [x in XIdx]: IdxKey<TCfg['indexes'][x]> };

export type CfgPIdxN<TCfg extends Cfg> = TCfg extends { primaryIndexName: infer PIdxN } ? PIdxN : never;

export type CfgPIdxKey<TCfg extends Cfg> = TCfg extends { primaryIndexName: infer PIdxN }
	? PIdxN extends keyof TCfg['indexes']
		? IdxKey<TCfg['indexes'][PIdxN]>
		: never
	: never;

export type CfgSIdxN<TCfg extends Cfg> = TCfg extends {
	primaryIndexName: infer PIdxN;
	indexes: { [x in infer Idx]: PIdxCfg };
}
	? Exclude<Idx, PIdxN>
	: never;

export type CfgSIdxKeyM<TCfg extends Cfg> = TCfg extends {
	primaryIndexName: infer PIdxN;
	indexes: { [x in infer Idx]: PIdxCfg };
}
	? { [x in Exclude<Idx, PIdxN>]: IdxKey<TCfg['indexes'][x]> }
	: never;

export class Table<TCfg extends Cfg> {
	constructor(public config: TCfg) {
		this.DocumentClient = config.client;

		const { primaryIndexName, indexes, ...methodConfig } = config;

		const { hashKey, rangeKey } = indexes[primaryIndexName];

		this.ConstructProps = {
			partitionKey: {
				name: hashKey.attribute,
				type:
					hashKey.type === 'string'
						? AttributeType.STRING
						: hashKey.type === 'number'
						? AttributeType.NUMBER
						: AttributeType.STRING
			},
			sortKey: rangeKey
				? {
						name: rangeKey.attribute,
						type:
							rangeKey.type === 'string'
								? AttributeType.STRING
								: rangeKey.type === 'number'
								? AttributeType.NUMBER
								: AttributeType.STRING
				  }
				: undefined
		};

		this.put = putFn(methodConfig);
		// this.get = getFn(methodConfig);
		// this.create = createFn(methodConfig);
		// this.update = updateFn(methodConfig);
		// this.query = queryFn(methodConfig);
		// this.scan = scanFn(methodConfig);
		// this.delete = deleteFn(methodConfig);
		// this.reset = resetFn(methodConfig, config.indexes[config.primaryIndexName]);

		this.createSet = config.client.createSet;
		this.batchWrite = config.client.batchWrite;
		this.batchGet = config.client.batchGet;
		this.transactWrite = config.client.transactWrite;
		this.transactGet = config.client.transactGet;
	}

	DocumentClient: DocumentClient;
	ConstructProps: Pick<TableProps, 'partitionKey' | 'sortKey'>;

	Index!: CfgIdxN<TCfg>;
	IndexKeyM!: CfgIdxKeyM<TCfg>;

	PrimaryIndex!: CfgPIdxN<TCfg>;
	PrimaryIndexKey!: CfgPIdxKey<TCfg>;

	SecondaryIndex!: CfgSIdxN<TCfg>;
	SecondaryIndexKeyM!: CfgSIdxKeyM<TCfg>;

	put: ReturnType<typeof putFn<TCfg>>;
	// get: ReturnType<typeof getFn<TPIdxN, TIdxCfgM>>;
	// create: ReturnType<typeof createFn<TPIdxN, TIdxCfgM>>;
	// update: ReturnType<typeof updateFn<TPIdxN, TIdxCfgM>>;
	// query: ReturnType<typeof queryFn<TPIdxN, TIdxCfgM>>;
	// scan: ReturnType<typeof scanFn<TPIdxN, TIdxCfgM>>;
	// delete: ReturnType<typeof deleteFn<TPIdxN, TIdxCfgM>>;
	// reset: ReturnType<typeof resetFn<TIdxCfgM[TPIdxN]>>;

	createSet: DocumentClient['createSet'];
	batchWrite: DocumentClient['batchWrite'];
	batchGet: DocumentClient['batchGet'];
	transactWrite: DocumentClient['transactWrite'];
	transactGet: DocumentClient['transactGet'];

	// get Item() {
	// 	const ParentTable = this;

	// 	return class TableItem<IA extends {} = {}, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> = never> extends Item<
	// 		IA,
	// 		ISIdxN,
	// 		TPIdxN,
	// 		TIdxA,
	// 		TIdxATL,
	// 		TIdxCfgM
	// 	> {
	// 		static createSet = ParentTable.config.client.createSet;

	// 		constructor(
	// 			props: IA,
	// 			Item: IdxAFns<TIdxCfgM[ISIdxN | TPIdxN]> &
	// 				ISIdxCfg<ISIdxN> &
	// 				Constructor<Item<IA, ISIdxN, TPIdxN, TIdxA, TIdxATL, TIdxCfgM>>
	// 		) {
	// 			super(props, Item, ParentTable);
	// 		}
	// 	};
	// }

	// get getters() {
	// 	return this.makeGetters();
	// }

	// makeGetters = () => {
	// 	return getters<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>(this);
	// };
}

export const dc =
	process.env.INTEGRATION_TEST === 'true'
		? new DynamoDB.DocumentClient()
		: new DynamoDB.DocumentClient({
				endpoint: 'localhost:8000',
				sslEnabled: false,
				region: 'local-env'
		  });

export const TestTable = new Table({
	name: process.env.DYNAMODB_TABLE || 'test',
	client: dc,
	// logger: console,
	primaryIndexName: 'primary',
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
} as const);

export const indexCheck: A.Equals<
	typeof TestTable['Index'],
	'primary' | 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const indexKeySingleAttribtuesCheck: A.Equals<keyof typeof TestTable['IndexKeyM']['gsi5'], 'gsi5Pk'> = 1;

export const indexKeyValueCheck: A.Equals<
	typeof TestTable['IndexKeyM']['gsi5'][keyof typeof TestTable['IndexKeyM']['gsi5']],
	number
> = 1;

export const primaryIndexCheck: A.Equals<typeof TestTable['PrimaryIndex'], 'primary'> = 1;

export const primaryIndexKeyAttribtuesCheck: A.Equals<keyof typeof TestTable['PrimaryIndexKey'], 'pk' | 'sk'> = 1;

export const primaryIndexKeyValuesCheck: A.Equals<
	typeof TestTable['PrimaryIndexKey'][keyof typeof TestTable['PrimaryIndexKey']],
	string
> = 1;

export const secondaryIndexCheck: A.Equals<
	typeof TestTable['SecondaryIndex'],
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

export const secondaryIndexKeySingleAttribtuesCheck: A.Equals<
	keyof typeof TestTable['SecondaryIndexKeyM']['gsi5'],
	'gsi5Pk'
> = 1;

export const secondaryIndexKeyValueCheck: A.Equals<
	typeof TestTable['IndexKeyM']['gsi5'][keyof typeof TestTable['SecondaryIndexKeyM']['gsi5']],
	number
> = 1;
