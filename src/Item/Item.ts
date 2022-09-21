import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { constructObject } from '../utils';
import { _delete } from '../Table/methods/delete';
import { update } from '../Table/methods/update';
import { create } from '../Table/methods/create';
import { put } from '../Table/methods/put';
import { IdxALiteral } from '../Index/Index';
import { IdxCfgProps, Table } from '../Table/Table';

export class Item<
	A extends object,
	IIdx extends Array<TIdxN>,
	TIdxN extends PropertyKey,
	TPIdxN extends TIdxN,
	TIdxA extends PropertyKey,
	TIdxAL extends IdxALiteral,
	IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
> {
	secondaryIndices: IIdx;
	Item: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
		[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
	};
	Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>;

	_initial: A;
	_current: A;

	constructor(
		props: A,
		secondaryIndices: IIdx,
		Item: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
			[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
		},
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) {
		this._initial = props;
		this._current = props;

		this.secondaryIndices = secondaryIndices;
		this.Item = Item;
		this.Table = Table;

		this.onNew();
	}

	get key(): IdxCfg[TPIdxN]['key'] {
		const index = this.Table.indexConfig[this.Table.tableConfig.primaryIndex];

		const attributes = [index.hashKey, index.rangeKey];
		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return constructObject(attributes, values);
	}

	indexKey = <Idx extends IIdx[number]>(index: Idx): IdxCfg[Idx]['key'] => {
		const secondaryIndex = this.Table.indexConfig[index];

		const attributes = [secondaryIndex.hashKey, secondaryIndex.rangeKey];
		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return constructObject(attributes, values);
	};

	get keys(): IdxCfg[IIdx[number]]['key'] & IdxCfg[TPIdxN]['key'] {
		const secondaryIndices = this.secondaryIndices.map(index => this.Table.indexConfig[index]);

		const attributes = _flatten(secondaryIndices.map(index => [index.hashKey, index.rangeKey]));
		const values = attributes.map(attribute => this.Item[attribute](this._current));

		return { ...constructObject(attributes, values), ...this.key };
	}

	get props() {
		return this._current;
	}

	get propsWithKeys() {
		return { ...this.keys, ...this._current };
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

	set = async (props: Partial<A>) => {
		await this.onSet();

		this._current = { ...this._current, ...props };

		if (this.Table.tableConfig.logger) this.Table.tableConfig.logger.info(this._current);

		return;
	};

	write = async () => {
		await this.onWrite();

		await put(this.Table)({
			Item: { ...this._current, ...this.keys }
		});

		return this;
	};

	create = async () => {
		await this.onWrite();
		await this.onCreate();

		await create(this.Table)({
			Key: this.key,
			Item: { ...this._current, ...this.keys }
		});

		return this;
	};

	update = async (props: Partial<A>) => {
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

		await update(this.Table)({
			Key: this.key,
			UpdateExpression,
			ExpressionAttributeValues
		});

		return this;
	};

	delete = async () => {
		await this.onDelete();

		await _delete(this.Table)({
			Key: this.key
		});

		return;
	};
}
