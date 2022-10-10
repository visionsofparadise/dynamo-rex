import { ILogger } from '../utils';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Item, StaticItem } from '../Item/Item';
import { getters } from '../getters/getters';
import { putFn } from './put';
import { getFn } from './get';
import { createFn } from './create';
import { updateFn } from './update';
import { scanFn } from './scan';
import { deleteFn } from './delete';
import { queryFn } from './query';
import { resetFn } from './reset';

export type IdxATL = 'string' | 'string?' | 'number' | 'number?';

export type IdxATLToType<TIdxATL extends IdxATL> = TIdxATL extends 'string'
	? string
	: TIdxATL extends 'string?'
	? string | undefined
	: TIdxATL extends 'number'
	? number
	: TIdxATL extends 'number?'
	? number | undefined
	: string | number;

export interface IdxACfg<TIdxA extends string, TIdxATL extends IdxATL> {
	attribute: TIdxA;
	type: TIdxATL;
}

export interface IdxCfg<HKA extends string, RKA extends string, HKATL extends IdxATL, RKATL extends IdxATL> {
	hashKey: IdxACfg<HKA, Exclude<HKATL, 'string?' | 'number?'>>;
	rangeKey?: IdxACfg<RKA, RKATL>;
}

export type IdxCfgSet<TIdxA extends string, TIdxATL extends IdxATL> = Record<
	string,
	IdxCfg<TIdxA, TIdxA, TIdxATL, TIdxATL>
>;

export type IdxKey<TIdxCfg extends IdxCfg<string, string, IdxATL, IdxATL>> = TIdxCfg['rangeKey'] extends IdxACfg<
	string,
	IdxATL
>
	? Record<TIdxCfg['hashKey']['attribute'], IdxATLToType<TIdxCfg['hashKey']['type']>> &
			Record<TIdxCfg['rangeKey']['attribute'], IdxATLToType<TIdxCfg['rangeKey']['type']>>
	: Record<TIdxCfg['hashKey']['attribute'], IdxATLToType<TIdxCfg['hashKey']['type']>>;

export interface MCfg {
	name: string;
	client: DocumentClient;
	logger?: ILogger;
}

interface TCfg<TPIdxN extends string & keyof InputIdxCfgSet, InputIdxCfgSet extends IdxCfgSet<string, IdxATL>>
	extends MCfg {
	primaryIndex: TPIdxN;
	indexes: InputIdxCfgSet;
}

export class Table<
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> {
	constructor(public config: TCfg<TPIdxN, TIdxCfg>) {
		const { primaryIndex, indexes, ...methodConfig } = config;

		const primaryIndexCfg = config.indexes[config.primaryIndex];

		this.put = putFn(methodConfig);
		this.get = getFn(methodConfig);
		this.create = createFn(methodConfig);
		this.update = updateFn(methodConfig);
		this.query = queryFn(methodConfig);
		this.scan = scanFn(methodConfig);
		this.delete = deleteFn(methodConfig);
		this.reset = resetFn({
			...methodConfig,
			hashKey: primaryIndexCfg.hashKey.attribute,
			rangeKey: primaryIndexCfg.rangeKey ? primaryIndexCfg.rangeKey.attribute : undefined
		});
	}

	Index!: string & keyof TIdxCfg;
	IndexKeyMap!: {
		[x in keyof TIdxCfg]: IdxKey<TIdxCfg[x]>;
	};

	PrimaryIndex!: TPIdxN;
	PrimaryIndexKey!: IdxKey<TIdxCfg[TPIdxN]>;

	SecondaryIndex!: string & Exclude<keyof TIdxCfg, TPIdxN>;
	SecondaryIndexKeyMap!: {
		[x in Exclude<keyof TIdxCfg, TPIdxN>]: IdxKey<TIdxCfg[x]>;
	};

	put: ReturnType<typeof putFn<typeof this['PrimaryIndexKey']>>;
	get: ReturnType<typeof getFn<typeof this['PrimaryIndexKey']>>;
	create: ReturnType<typeof createFn<typeof this['PrimaryIndexKey']>>;
	update: ReturnType<typeof updateFn<typeof this['PrimaryIndexKey']>>;
	query: ReturnType<typeof queryFn<TPIdxN, typeof this['IndexKeyMap']>>;
	scan: ReturnType<typeof scanFn<TPIdxN, typeof this['IndexKeyMap']>>;
	delete: ReturnType<typeof deleteFn<typeof this['PrimaryIndexKey']>>;
	reset: ReturnType<typeof resetFn<TPIdxN, typeof this['IndexKeyMap']>>;

	get Item() {
		const ParentTable = this;

		return class TableItem<
			IA extends Record<string, any>,
			ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never
		> extends Item<IA, ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg> {
			constructor(props: IA, Item: StaticItem<ISIdx | TPIdxN, TIdxCfg> & { secondaryIndexes: Array<ISIdx> }) {
				super(props, Item, ParentTable);
			}
		};
	}

	get getters() {
		return this.makeGetters();
	}

	makeGetters = () => {
		return getters<TIdxA, TIdxATL, TPIdxN, TIdxCfg>(this);
	};
}
