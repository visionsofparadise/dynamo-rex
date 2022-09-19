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

export type UnionToIntersection<Union> = (Union extends any ? (argument: Union) => void : never) extends (
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
	DocumentClient: DocumentClient;
	tableConfig: { name: string; primaryIndex: TPIdxN; logger?: ILogger };
	indexConfig: IdxCfg;

	constructor(
		DocumentClient: DocumentClient,
		tableConfig: { name: string; primaryIndex: TPIdxN; logger?: ILogger },
		indexConfig: IdxCfg
	) {
		this.DocumentClient = DocumentClient;
		this.tableConfig = tableConfig;
		this.indexConfig = indexConfig;
	}

	IndexNames!: keyof IdxCfg;
	SecondaryIndexNames!: Exclude<keyof IdxCfg, TPIdxN>;
	PrimaryIndex!: TPIdxN;
	IndexKeys!: { [x in keyof IdxCfg]: IdxCfg[x]['key'] };
	IndexAttributeValues!: UnionToIntersection<IdxCfg[keyof IdxCfg]['key']>;

	get put() {
		return put(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get create() {
		return create(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get update() {
		return update(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get get() {
		return get(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get query() {
		return query(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get scan() {
		return scan(this.DocumentClient, this.tableConfig.name, this.tableConfig.logger);
	}

	get delete() {
		return _delete(this.DocumentClient, this.tableConfig.name);
	}

	get reset() {
		return reset(
			this.DocumentClient,
			this.tableConfig.name,
			this.indexConfig[this.tableConfig.primaryIndex]['hashKey'],
			this.indexConfig[this.tableConfig.primaryIndex]['rangeKey'],
			this.tableConfig.logger
		);
	}

	Item = <IIdx extends Array<Exclude<TIdxN, TPIdxN>>>(secondaryIndices: IIdx) => {
		const client = this.DocumentClient;
		const tableConfig = this.tableConfig;
		const indexConfig = this.indexConfig;
		return class TableItem<A extends object> extends Item<A, IIdx, TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg> {
			static secondaryIndices: IIdx = secondaryIndices;

			constructor(
				props: A,
				indexFunctions: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
					[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
				}
			) {
				super(props, secondaryIndices, indexFunctions, client, tableConfig, indexConfig);
			}
		};
	};

	get getters() {
		return this.makeGetters();
	}

	makeGetters = () => {
		return getters<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>(this.DocumentClient, this.tableConfig, this.indexConfig);
	};
}
