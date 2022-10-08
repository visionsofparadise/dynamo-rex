import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { constructObject, UnionToIntersection } from '../utils';
import { Table, IdxATL, IdxKey, IdxCfgSet } from '../Table/Table';

export type StaticItem<
	ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never,
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> = {
	[x in keyof IdxKey<TIdxCfg[TPIdxN]>]: (params: any) => IdxKey<TIdxCfg[TPIdxN]>[x];
} & {
	[x in keyof IdxKey<TIdxCfg[ISIdx]>]: (params: any) => IdxKey<TIdxCfg[ISIdx]>[x];
} & { new (...args: any[]): any; secondaryIndexes: Array<ISIdx> };

export class Item<
	IA extends object,
	ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never,
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> {
	Item: StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>;
	Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>;

	_initial: IA;
	_current: IA;

	constructor(
		props: IA,
		Item: StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>,
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) {
		this._initial = props;
		this._current = props;

		this.Item = Item;
		this.Table = Table;

		this.onNew();
	}

	get key(): IdxKey<TIdxCfg[TPIdxN]> {
		return this.indexKey(this.Table.config.primaryIndex);
	}

	indexKey<Idx extends ISIdx | TPIdxN>(index: Idx): IdxKey<TIdxCfg[Idx]> {
		const { hashKey, rangeKey } = this.Table.config.indexes[index];

		const attributes = rangeKey ? [hashKey.attribute, rangeKey.attribute] : [hashKey.attribute];

		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return constructObject(attributes, values);
	}

	get indexKeys() {
		const mergedKeys = this.Item.secondaryIndexes.reduce(
			(prev, cur) => ({ ...prev, ...this.indexKey(cur) }),
			{}
		) as {} & UnionToIntersection<Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>['IndexKeyMap'][ISIdx]>;

		return { ...mergedKeys, ...this.key };
	}

	get props() {
		return this._current;
	}

	get propsWithKeys() {
		return { ...this.indexKeys, ...this._current };
	}

	get init() {
		return this._initial;
	}

	onNew() {}
	async onGet() {}
	async onSet() {}
	async onWrite() {}
	async onCreate() {}
	async onDelete() {}

	async set(props: Partial<IA>) {
		await this.onSet();

		this._current = { ...this._current, ...props };

		if (this.Table.config.logger) this.Table.config.logger.info(this._current);

		return;
	}

	async write() {
		await this.onWrite();

		await this.Table.put({
			Item: this.propsWithKeys
		});

		return this;
	}

	async create() {
		await this.onWrite();
		await this.onCreate();

		await this.Table.create({
			Key: this.key,
			Item: this.propsWithKeys
		});

		return this;
	}

	async update(props: Partial<IA>) {
		await this.set(props);

		let untrimmedUpdateExpression = 'SET ';
		let ExpressionAttributeValues = {};

		for (const key of Object.keys(props)) {
			untrimmedUpdateExpression += `${key} = :${key}, `;
			ExpressionAttributeValues = {
				...ExpressionAttributeValues,
				[`:${key}`]: _get(props, key)
			};
		}

		const UpdateExpression = untrimmedUpdateExpression.slice(0, untrimmedUpdateExpression.length - 2);

		await this.Table.update({
			Key: this.key,
			UpdateExpression,
			ExpressionAttributeValues
		});

		return this;
	}

	async delete() {
		await this.onDelete();

		await this.Table.delete({
			Key: this.key
		});

		return;
	}
}
