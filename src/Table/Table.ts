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
import { hasItemFn, hasItemsFn } from './hasItem';
import { hasPutAttributesFn, hasUpdateAttributesFn } from './hasAttributes';

export type IdxATL = 'string' | 'number';

type IdxATLToType<TIdxATL extends IdxATL> = TIdxATL extends 'string'
	? string
	: TIdxATL extends 'number'
	? number
	: string | number;

export type IdxACfg<TIdxA extends string, TIdxATL extends IdxATL> = {
	attribute: TIdxA;
	type: TIdxATL;
};

export type IdxCfg<HKA extends string, RKA extends string, HKATL extends IdxATL, RKATL extends IdxATL> = {
	hashKey: IdxACfg<HKA, HKATL>;
	rangeKey?: IdxACfg<RKA, RKATL>;
};

export type IdxCfgSet<TIdxA extends string, TIdxATL extends IdxATL> = Record<
	string,
	IdxCfg<TIdxA, TIdxA, TIdxATL, TIdxATL>
>;

export type IdxKey<TIdxCfg extends IdxCfg<string, string, IdxATL, IdxATL>> = Record<
	TIdxCfg['hashKey']['attribute'],
	IdxATLToType<TIdxCfg['hashKey']['type']>
> &
	(TIdxCfg['rangeKey'] extends IdxACfg<string, IdxATL>
		? Record<TIdxCfg['rangeKey']['attribute'], IdxATLToType<TIdxCfg['rangeKey']['type']>>
		: {});

type TCfg<TPIdxN extends string & keyof InputIdxCfgSet, InputIdxCfgSet extends IdxCfgSet<string, IdxATL>> = {
	name: string;
	client: DocumentClient;
	primaryIndex: TPIdxN;
	indexes: InputIdxCfgSet;
	logger?: ILogger;
};

export class Table<
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> {
	constructor(public config: TCfg<TPIdxN, TIdxCfg>) {
		this.hasItem = hasItemFn();
		this.hasItems = hasItemsFn();
		this.hasPutAttributes = hasPutAttributesFn();
		this.hasUpdateAttributes = hasUpdateAttributesFn();

		this.put = putFn(this);
		this.get = getFn(this);
		this.create = createFn(this);
		this.update = updateFn(this);
		this.query = queryFn(this);
		this.scan = scanFn(this);
		this.delete = deleteFn(this);
		this.reset = resetFn(this);
	}

	Index!: keyof TIdxCfg;
	IndexKeyMap!: {
		[x in keyof TIdxCfg]: IdxKey<TIdxCfg[x]>;
	};

	PrimaryIndex!: TPIdxN;
	PrimaryIndexKey!: IdxKey<TIdxCfg[TPIdxN]>;

	SecondaryIndex!: string & Exclude<keyof TIdxCfg, TPIdxN>;
	SecondaryIndexKeyMap!: {
		[x in Exclude<keyof TIdxCfg, TPIdxN>]: IdxKey<TIdxCfg[x]>;
	};

	hasItem: ReturnType<typeof hasItemFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	hasItems: ReturnType<typeof hasItemsFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	hasPutAttributes: ReturnType<typeof hasPutAttributesFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	hasUpdateAttributes: ReturnType<typeof hasUpdateAttributesFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;

	put: ReturnType<typeof putFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	get: ReturnType<typeof getFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	create: ReturnType<typeof createFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	update: ReturnType<typeof updateFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	query: ReturnType<typeof queryFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	scan: ReturnType<typeof scanFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	delete: ReturnType<typeof deleteFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;
	reset: ReturnType<typeof resetFn<TIdxA, TIdxATL, TPIdxN, TIdxCfg>>;

	get Item() {
		const ParentTable = this;

		return class TableItem<
			IA extends object,
			ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never
		> extends Item<IA, ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg> {
			constructor(props: IA, Item: StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>) {
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
