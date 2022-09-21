import _pick from 'lodash/pick';
import _chunk from 'lodash/chunk';
import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { get } from './methods/get';
import { put } from './methods/put';
import { create } from './methods/create';
import { update } from './methods/update';
import { query } from './methods/query';
import { scan } from './methods/scan';
import { _delete } from './methods/delete';
import { reset } from './methods/reset';
import { Index } from '../Index/Index';
import { IdxALiteral } from '../Index/Index';
import { ILogger } from '../utils';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Item } from '../Item/Item';
import { getters } from '../getters/getters';

type UnionToIntersection<Union> = (Union extends any ? (argument: Union) => void : never) extends (
	argument: infer Intersection
) => void
	? Intersection
	: never;

export type IdxCfgProps<TIdxN extends PropertyKey, TIdxA extends PropertyKey, TIdxAL extends IdxALiteral> = {
	[x in TIdxN]: Index<x, TIdxA, TIdxA, TIdxAL, TIdxAL>;
};

export class Table<
	TIdxN extends PropertyKey,
	TPIdxN extends TIdxN,
	TIdxA extends PropertyKey,
	TIdxAL extends IdxALiteral,
	IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
> {
	tableConfig: { name: string; primaryIndex: TPIdxN; client: DocumentClient; logger?: ILogger };
	indexConfig: IdxCfg;

	constructor(
		tableConfig: { name: string; primaryIndex: TPIdxN; client: DocumentClient; logger?: ILogger },
		indexConfig: IdxCfg
	) {
		this.tableConfig = tableConfig;
		this.indexConfig = indexConfig;

		this.put = put(this);
		this.create = create(this);
		this.update = update(this);
		this.get = get(this);
		this.query = query(this);
		this.scan = scan(this);
		this.delete = _delete(this);
		this.reset = reset(this);
	}

	IndexNames!: keyof IdxCfg;
	SecondaryIndexNames!: Exclude<keyof IdxCfg, TPIdxN>;
	PrimaryIndex!: TPIdxN;
	IndexKeys!: { [x in keyof IdxCfg]: IdxCfg[x]['key'] };
	IndexAttributeValues!: UnionToIntersection<IdxCfg[keyof IdxCfg]['key']>;

	put: ReturnType<typeof put<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	create: ReturnType<typeof create<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	update: ReturnType<typeof update<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	get: ReturnType<typeof get<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	query: ReturnType<typeof query<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	scan: ReturnType<typeof scan<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	delete: ReturnType<typeof _delete<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;
	reset: ReturnType<typeof reset<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>>;

	Item = <IIdx extends Array<Exclude<TIdxN, TPIdxN>>>(secondaryIndices?: IIdx) => {
		const ParentTable = this;

		const fallbackSecondaryIndices = secondaryIndices || ([] as unknown as IIdx);

		return class TableItem<A extends object> extends Item<A, IIdx, TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg> {
			static secondaryIndices = fallbackSecondaryIndices;

			constructor(
				props: A,
				Item: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
					[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
				}
			) {
				super(props, fallbackSecondaryIndices, Item, ParentTable);
			}
		};
	};

	get getters() {
		return this.makeGetters();
	}

	makeGetters = () => {
		return getters<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>(this);
	};
}
