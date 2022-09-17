import { DocumentClient } from 'aws-sdk/clients/dynamodb';
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
import { getters } from '../getters/getters';
import { Index } from '../Index/Index';
import { IdxAType } from '../Index/Index';
import { ILogger } from '../utils';
import { Item, SelfItem } from '../Item/Item';

export interface TCfgProps<
	TIdx extends PropertyKey,
	TPIdx extends TIdx,
	TIdxA extends PropertyKey,
	TIdxAType extends IdxAType
> {
	name: string;
	indices: Record<TIdx, Index<TIdx, TIdxA, TIdxA, TIdxAType, TIdxAType>>;
	primaryIndex: TPIdx;
	logger?: ILogger;
}

export class Table<
	TIdx extends PropertyKey,
	TPIdx extends TIdx,
	TIdxA extends PropertyKey,
	TIdxAType extends IdxAType,
	TCfg extends TCfgProps<TIdx, TPIdx, TIdxA, TIdxAType>
> {
	DocumentClient: DocumentClient;
	config: TCfg;

	name: string;
	indices: TCfg['indices'];
	primaryIndex: TCfg['primaryIndex'];
	logger?: ILogger;

	constructor(DocumentClient: DocumentClient, config: TCfg) {
		this.DocumentClient = DocumentClient;
		this.config = config;

		this.name = config.name;
		this.indices = config.indices;
		this.primaryIndex = config.primaryIndex;
		this.logger = config.logger;
	}

	Index!: keyof TCfg['indices'];
	PrimaryIndex!: TCfg['primaryIndex'];
	SecondaryIndex!: Exclude<keyof TCfg['indices'], TCfg['primaryIndex']>;

	get put() {
		return put(this.DocumentClient, this.name, this.logger);
	}

	get create() {
		return create(this.DocumentClient, this.name, this.logger);
	}

	get update() {
		return update(this.DocumentClient, this.name, this.logger);
	}

	get get() {
		return get(this.DocumentClient, this.name, this.logger);
	}

	get query() {
		return query(this.DocumentClient, this.name, this.logger);
	}

	get scan() {
		return scan(this.DocumentClient, this.name, this.logger);
	}

	get delete() {
		return _delete(this.DocumentClient, this.name);
	}

	get reset() {
		return reset(
			this.DocumentClient,
			this.name,
			this.indices[this.primaryIndex]['attributes']['hashKey'],
			this.indices[this.primaryIndex]['attributes']['rangeKey'],
			this.logger
		);
	}

	getters = getters<TIdx, TPIdx, TIdxA, TIdxAType, TCfg>(this);

	get Item() {
		return this.tableItem();
	}

	tableItem = () => {
		const ParentTable = this;

		return class CreatedItem<
			A extends object,
			ISIdx extends Exclude<keyof TCfg['indices'], TCfg['primaryIndex']>
		> extends Item<A, TIdx, TPIdx, ISIdx, TIdxA, TIdxAType, TCfg> {
			constructor(props: A, SelfItem: SelfItem<TIdx, TPIdx, ISIdx, TIdxA, TIdxAType, TCfg>) {
				super(props, SelfItem, ParentTable);
			}
		};
	};
}
