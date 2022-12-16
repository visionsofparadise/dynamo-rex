import { Constructor, zipObject } from '../utils';
import { Table, IdxATL, IdxKey, IdxCfgM, NotPIdxN, IdxKeys, TIdxN, PIdxCfg } from '../Table/Table';
import assert from 'assert';

export type IdxAFns<TIdxCfg extends PIdxCfg> = {
	[x in keyof IdxKey<TIdxCfg>]: (params: any) => IdxKey<TIdxCfg>[x];
};

export interface ISIdxCfg<ISIdxN extends string> {
	secondaryIndexes: Array<ISIdxN>;
}

export interface ItemMethodConfig {
	skipHooks?: boolean;
}

export abstract class Item<
	IA extends {} = {},
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never = never,
	TPIdxN extends TIdxN<TIdxCfgM> = string,
	TIdxA extends string = string,
	TIdxATL extends IdxATL = IdxATL,
	TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL> = IdxCfgM<TPIdxN, TIdxA, TIdxATL>
> {
	Table: Table<TPIdxN, TIdxA, TIdxATL, string, never, TIdxCfgM>;
	Item: IdxAFns<TIdxCfgM[ISIdxN | TPIdxN]> &
		ISIdxCfg<ISIdxN> &
		Constructor<Item<IA, ISIdxN, TPIdxN, TIdxA, TIdxATL, TIdxCfgM>>;

	Attributes!: IA;
	initial: IA;
	current: IA;

	static test: () => any;

	constructor(
		props: IA,
		Item: IdxAFns<TIdxCfgM[ISIdxN | TPIdxN]> &
			ISIdxCfg<ISIdxN> &
			Constructor<Item<IA, ISIdxN, TPIdxN, TIdxA, TIdxATL, TIdxCfgM>>,
		Table: Table<TPIdxN, TIdxA, TIdxATL, string, never, TIdxCfgM>
	) {
		this.initial = props;
		this.current = props;

		this.Item = Item;
		this.Table = Table;

		this.onNew();
	}

	get key(): IdxKey<TIdxCfgM[TPIdxN]> {
		return this.indexKey(this.Table.config.primaryIndex);
	}

	indexKey<IdxN extends ISIdxN | TPIdxN>(index: IdxN): IdxKey<TIdxCfgM[IdxN]> {
		const { hashKey, rangeKey } = this.Table.config.indexes[index];

		const attributes = rangeKey ? [hashKey.attribute, rangeKey.attribute] : [hashKey.attribute];

		const values = attributes.map(attribute => this.Item[attribute](this.current));

		return zipObject(attributes, values);
	}

	get indexKeys() {
		const keys = this.Item.secondaryIndexes.reduce((prev, cur) => ({ ...prev, ...this.indexKey(cur) }), {}) as IdxKeys<
			ISIdxN,
			TIdxCfgM
		>;

		return { ...keys, ...this.key };
	}

	get props() {
		return this.current;
	}

	get propsWithKeys() {
		return { ...this.indexKeys, ...this.current };
	}

	get init() {
		return this.initial;
	}

	get isModified() {
		try {
			assert.deepStrictEqual(this.init, this.current);

			return false;
		} catch (error) {
			return true;
		}
	}

	isPropModified(...keys: Array<keyof IA>) {
		return keys.reduce((previous, current) => (this.init[current] !== this.current[current] ? true : previous), false);
	}

	onNew() {}
	async onPreSet() {}
	async onPostSet() {}
	async onPreWrite() {}
	async onPostWrite() {}
	async onPreCreate() {}
	async onPostCreate() {}
	async onPreUpdate() {}
	async onPostUpdate() {}
	async onPreDelete() {}
	async onPostDelete() {}

	async set(props: Partial<IA>, config: ItemMethodConfig = {}) {
		if (!config.skipHooks) await this.onPreSet();

		this.current = { ...this.current, ...props };

		if (this.Table.config.logger) this.Table.config.logger.info(this.current);

		if (!config.skipHooks) await this.onPostSet();

		return;
	}

	async write(config: ItemMethodConfig = {}) {
		if (this.isModified) {
			if (!config.skipHooks) await this.onPreWrite();

			await this.Table.put<IA, never, ISIdxN>({
				Item: this.propsWithKeys
			});

			if (!config.skipHooks) await this.onPostWrite();
		}

		return;
	}

	async create(config: ItemMethodConfig & { skipCreateHooks?: boolean; skipWriteHooks?: boolean } = {}) {
		if (!config.skipHooks && !config.skipCreateHooks) await this.onPreCreate();
		if (!config.skipHooks && !config.skipWriteHooks) await this.onPreWrite();

		await this.Table.create<IA, never, ISIdxN>({
			Key: this.key,
			Item: this.propsWithKeys
		});

		if (!config.skipHooks && !config.skipCreateHooks) await this.onPostCreate();
		if (!config.skipHooks && !config.skipWriteHooks) await this.onPostWrite();

		return;
	}

	async update(
		props: Partial<IA>,
		config: ItemMethodConfig & { skipUpdateHooks?: boolean; skipWriteHooks?: boolean; skipDiff?: boolean } = {}
	) {
		await this.set(props);

		if (this.isModified && !config.skipDiff) {
			if (!config.skipHooks && !config.skipUpdateHooks) await this.onPreUpdate();
			if (!config.skipHooks && !config.skipWriteHooks) await this.onPreWrite();

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

			await this.Table.update<IA, never, ISIdxN>({
				Key: this.key,
				UpdateExpression,
				ExpressionAttributeValues
			});

			if (!config.skipHooks && !config.skipUpdateHooks) await this.onPostUpdate();
			if (!config.skipHooks && !config.skipWriteHooks) await this.onPostWrite();
		}

		return;
	}

	async delete(config: ItemMethodConfig = {}) {
		if (!config.skipHooks) await this.onPreDelete();

		await this.Table.delete<IA, never, ISIdxN>({
			Key: this.key
		});

		if (!config.skipHooks) await this.onPostDelete();

		return;
	}
}
