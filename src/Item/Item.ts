import { Constructor, zipObject } from '../utils';
import { Table, IdxATL, IdxKey, IdxCfgM, NotPIdxN, IdxKeys, TIdxN, PIdxCfg } from '../Table/Table';
import assert from 'assert';
import { O } from 'ts-toolbelt';

export type IdxAFns<TIdxCfg extends PIdxCfg> = {
	[x in keyof IdxKey<TIdxCfg>]: (params: any) => IdxKey<TIdxCfg>[x];
};

export interface ISIdxCfg<ISIdxN extends string> {
	secondaryIndexes: Array<ISIdxN>;
}

export interface IItemConfig {
	skipHooks?: boolean;
	skipCreateHooks?: boolean;
	skipWriteHooks?: boolean;
	skipUpdateHooks?: boolean;
	skipDeleteHooks?: boolean;
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

	initialData: IA;
	currentData: IA;

	configProps: IItemConfig = {};

	constructor(
		item: IA,
		Item: IdxAFns<TIdxCfgM[ISIdxN | TPIdxN]> &
			ISIdxCfg<ISIdxN> &
			Constructor<Item<IA, ISIdxN, TPIdxN, TIdxA, TIdxATL, TIdxCfgM>>,
		Table: Table<TPIdxN, TIdxA, TIdxATL, string, never, TIdxCfgM>,
		config?: Partial<IItemConfig>
	) {
		this.initialData = item;
		this.currentData = item;

		this.Item = Item;
		this.Table = Table;

		config && this.config(config);

		if (!config?.skipHooks) this.onNew();
	}

	config = (config: Partial<IItemConfig>) => (this.configProps = { ...this.configProps, ...config });

	get key(): IdxKey<TIdxCfgM[TPIdxN]> {
		return this.indexKey(this.Table.config.primaryIndex);
	}

	indexKey<IdxN extends ISIdxN | TPIdxN>(index: IdxN): IdxKey<TIdxCfgM[IdxN]> {
		const { hashKey, rangeKey } = this.Table.config.indexes[index];

		const attributes = rangeKey ? [hashKey.attribute, rangeKey.attribute] : [hashKey.attribute];

		const values = attributes.map(attribute => this.Item[attribute](this.currentData));

		return zipObject(attributes, values);
	}

	get indexKeys() {
		const keys = this.Item.secondaryIndexes.reduce((prev, cur) => ({ ...prev, ...this.indexKey(cur) }), {}) as IdxKeys<
			ISIdxN,
			TIdxCfgM
		>;

		return { ...keys, ...this.key };
	}

	get item() {
		return this.currentData;
	}

	get itemWithKeys() {
		return { ...this.currentData, ...this.indexKeys };
	}

	get init() {
		return this.initialData;
	}

	isModified(initialData?: IA) {
		try {
			assert.deepStrictEqual(initialData || this.init, this.currentData);

			return false;
		} catch (error) {
			return true;
		}
	}

	isAttributeModified(...keys: Array<keyof IA>) {
		return keys.reduce(
			(previous, current) => (this.init[current] !== this.currentData[current] ? true : previous),
			false
		);
	}

	isAttributeObjectModified = (...keys: Array<keyof IA>) =>
		keys.reduce((previous, current) => {
			try {
				assert.deepStrictEqual(this.init[current], this.currentData[current]);

				return previous;
			} catch (error) {
				return true;
			}
		}, false);

	onNew() {}

	async onPreSet() {}
	async preSet() {
		if (!this.configProps.skipHooks) this.onPreSet();
	}

	async onPostSet() {}
	async postSet() {
		if (!this.configProps.skipHooks) this.onPostSet();
	}

	async onPreWrite() {}
	async preWrite() {
		if (!this.configProps.skipHooks && !this.configProps.skipWriteHooks) this.onPreWrite();
	}

	async onPostWrite() {}
	async postWrite() {
		if (!this.configProps.skipHooks && !this.configProps.skipWriteHooks) this.onPostWrite();
	}

	async onPreCreate() {
		await this.preWrite();
	}
	async preCreate() {
		if (!this.configProps.skipHooks && !this.configProps.skipCreateHooks) this.onPreCreate();
	}

	async onPostCreate() {
		await this.postWrite();
	}
	async postCreate() {
		if (!this.configProps.skipHooks && !this.configProps.skipCreateHooks) this.onPostCreate();
	}

	async onPreUpdate() {
		await this.preWrite();
	}
	async preUpdate() {
		if (!this.configProps.skipHooks && !this.configProps.skipUpdateHooks) this.onPreUpdate();
	}

	async onPostUpdate() {
		await this.postWrite();
	}
	async postUpdate() {
		if (!this.configProps.skipHooks && !this.configProps.skipUpdateHooks) this.onPostUpdate();
	}

	async onPreDelete() {}
	async preDelete() {
		if (!this.configProps.skipHooks && !this.configProps.skipDeleteHooks) this.onPreDelete();
	}

	async onPostDelete() {}
	async postDelete() {
		if (!this.configProps.skipHooks && !this.configProps.skipDeleteHooks) this.onPostDelete();
	}

	async set(itemAttributes: Partial<IA>) {
		await this.preSet();

		this.currentData = { ...this.currentData, ...itemAttributes };

		if (this.Table.config.logger) this.Table.config.logger.info(this.currentData);

		await this.postSet();

		return;
	}

	async write() {
		await this.preWrite();

		await this.Table.put<IA, never, ISIdxN>({
			Item: this.itemWithKeys
		});

		await this.postWrite();

		return;
	}

	async create() {
		await this.preCreate();

		await this.Table.create<IA, never, ISIdxN>({
			Item: this.itemWithKeys
		});

		await this.postCreate();

		return;
	}

	async update(itemAttributes: O.Partial<IA, 'deep'>) {
		await this.preUpdate();

		const response = await this.Table.updateFromObject<IA, 'ALL_NEW', ISIdxN>(
			{
				Key: this.key,
				ReturnValues: 'ALL_NEW'
			},
			itemAttributes
		);

		await this.set(response.Attributes);

		await this.postUpdate();

		return;
	}

	async delete() {
		await this.preDelete();

		await this.Table.delete<IA, never, ISIdxN>({
			Key: this.key
		});

		await this.postDelete();

		return;
	}
}
