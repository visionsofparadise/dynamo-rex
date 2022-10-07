import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { constructObject } from '../utils';
import { Table, IdxATL, IdxKey, IdxCfgSet } from '../Table/Table';

export type StaticItem<
	ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never,
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> = {
	[x in keyof IdxKey<TIdxCfg[TPIdxN]>]: (...params: any[]) => IdxKey<TIdxCfg[TPIdxN]>[x];
} & {
	[x in keyof IdxKey<TIdxCfg[ISIdx]>]: (...params: any[]) => IdxKey<TIdxCfg[ISIdx]>[x] | undefined;
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

	static defaults<D>(props: D) {
		return props;
	}

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
		const primaryIndex = this.Table.config.indexes[this.Table.config.primaryIndex];

		const attributes = primaryIndex.rangeKey
			? [primaryIndex.hashKey.attribute, primaryIndex.rangeKey.attribute]
			: [primaryIndex.hashKey.attribute];

		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return constructObject(attributes, values);
	}

	indexKey<Idx extends ISIdx>(index: Idx): IdxKey<TIdxCfg[Idx]> {
		const secondaryIndex = this.Table.config.indexes[index];

		const attributes = secondaryIndex.rangeKey
			? [secondaryIndex.hashKey.attribute, secondaryIndex.rangeKey.attribute]
			: [secondaryIndex.hashKey.attribute];

		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return constructObject(attributes, values);
	}

	get indexKeys(): IdxKey<TIdxCfg[ISIdx | TPIdxN]> {
		const secondaryIndexKeys = this.Item.secondaryIndexes.map(index => this.indexKey(index));

		const attributes = _flatten(secondaryIndexKeys.map(key => Object.keys(key) as Array<keyof typeof key>));
		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return { ...constructObject(attributes, values), ...this.key };
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
