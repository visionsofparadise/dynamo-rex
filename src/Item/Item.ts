import { zipObject, UnionToIntersection } from '../utils';
import { Table, IdxATL, IdxKey, IdxCfgSet } from '../Table/Table';

export type StaticItem<IdxN extends string & keyof TIdxCfg, TIdxCfg extends IdxCfgSet<string, IdxATL>> = {
	[x in keyof IdxKey<TIdxCfg[IdxN]>]: (params: any) => IdxKey<TIdxCfg[IdxN]>[x];
} & { new (...args: any[]): any };

export class Item<
	IA extends Record<string, any>,
	ISIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never,
	TIdxA extends string,
	TIdxATL extends IdxATL,
	TPIdxN extends string & keyof TIdxCfg,
	TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
> {
	Item: StaticItem<ISIdx | TPIdxN, TIdxCfg> & { secondaryIndexes: Array<ISIdx> };
	Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>;

	#initial: IA;
	#current: IA;

	constructor(
		props: IA,
		Item: StaticItem<ISIdx | TPIdxN, TIdxCfg> & { secondaryIndexes: Array<ISIdx> },
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) {
		this.#initial = props;
		this.#current = props;

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

		const values = attributes.map(attribute => this.Item[attribute](this.#current));

		return zipObject(attributes, values);
	}

	get indexKeys() {
		const mergedKeys = this.Item.secondaryIndexes.reduce(
			(prev, cur) => ({ ...prev, ...this.indexKey(cur) }),
			{}
		) as {} & UnionToIntersection<Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>['IndexKeyMap'][ISIdx]>;

		return { ...mergedKeys, ...this.key };
	}

	get props() {
		return this.#current;
	}

	get propsWithKeys() {
		return { ...this.indexKeys, ...this.#current };
	}

	get init() {
		return this.#initial;
	}

	onNew() {}
	async onSet() {}
	async onWrite() {}
	async onCreate() {}
	async onDelete() {}

	async set(props: Partial<IA>) {
		await this.onSet();

		this.#current = { ...this.#current, ...props };

		if (this.Table.config.logger) this.Table.config.logger.info(this.#current);

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

		for (const key of Object.keys(props) as Array<keyof IA>) {
			untrimmedUpdateExpression += `${String(key)} = :${String(key)}, `;
			ExpressionAttributeValues = {
				...ExpressionAttributeValues,
				[`:${String(key)}`]: props[key]
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
