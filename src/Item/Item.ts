import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { Table, TCfgProps } from '../Table/Table';
import { IdxAType, Index } from '../Index/Index';
import { constructObject } from '../utils';

export type SelfItem<
	TIdx extends PropertyKey,
	TPIdx extends TIdx,
	ISIdx extends keyof TCfg['indices'],
	TIdxA extends PropertyKey,
	TIdxAType extends IdxAType,
	TCfg extends TCfgProps<TIdx, TPIdx, TIdxA, TIdxAType>
> = {
	secondaryIndices: Array<Index<ISIdx, TIdxA, TIdxA, TIdxAType, TIdxAType>>;

	new (...params: any): any;
} & {
	[x in keyof TCfg['indices'][ISIdx]['types']['key']]: (props: any) => TCfg['indices'][ISIdx]['types']['key'][x];
} & {
	[x in keyof TCfg['indices'][TCfg['primaryIndex']]['types']['key']]: (
		props: any
	) => TCfg['indices'][TCfg['primaryIndex']]['types']['key'][x];
};

export class Item<
	A extends object,
	TIdx extends PropertyKey,
	TPIdx extends TIdx,
	ISIdx extends Exclude<keyof TCfg['indices'], TCfg['primaryIndex']>,
	TIdxA extends PropertyKey,
	TIdxAType extends IdxAType,
	TCfg extends TCfgProps<TIdx, TPIdx, TIdxA, TIdxAType>
> {
	readonly Table: Table<TIdx, TPIdx, TIdxA, TIdxAType, TCfg>;
	readonly Item: SelfItem<TIdx, TPIdx, ISIdx, TIdxA, TIdxAType, TCfg>;

	readonly _initial: A;
	_current: A;

	constructor(
		props: A,
		SelfItem: SelfItem<TIdx, TPIdx, ISIdx, TIdxA, TIdxAType, TCfg>,
		Table: Table<TIdx, TPIdx, TIdxA, TIdxAType, TCfg>
	) {
		this.Table = Table;
		this.Item = SelfItem;

		this._initial = props;
		this._current = props;

		this.onNew();
	}

	get key(): TCfg['indices'][TCfg['primaryIndex']]['types']['key'] {
		return this.indexKey(this.Table.primaryIndex);
	}

	indexKey = <Idx extends ISIdx | TPIdx>(index: Idx): TCfg['indices'][Idx]['types']['key'] => {
		const attributes = [this.Table.indices[index].attributes.hashKey, this.Table.indices[index].attributes.rangeKey];

		return constructObject(
			attributes,
			attributes.map(attribute => this.Item[attribute](this._current))
		);
	};

	get keys(): TCfg['indices'][TCfg['primaryIndex']]['types']['key'] & TCfg['indices'][ISIdx]['types']['key'] {
		const secondaryIndexNames = this.Item.secondaryIndices.map(index => index.name);

		const attributes = _flatten(
			secondaryIndexNames.map(index => [
				this.Table.indices[index].attributes.hashKey,
				this.Table.indices[index].attributes.rangeKey
			])
		);

		const secondaryKeys = constructObject(
			attributes,
			attributes.map(attribute => this.Item[attribute](this._current))
		);

		return { ...this.key, ...secondaryKeys };
	}

	get props() {
		return this._current;
	}

	get propsWithKeys() {
		return { ...this._current, ...this.keys };
	}

	get init() {
		return this._initial;
	}

	onNew: () => any = () => {};
	onSet: () => Promise<any> = async () => {};
	onWrite: () => Promise<any> = async () => {};
	onCreate: () => Promise<any> = async () => {};
	onDelete: () => Promise<any> = async () => {};

	readonly set = async (props: Partial<typeof this._current>) => {
		await this.onSet();

		this._current = { ...this._current, ...props };

		if (this.Table.logger) this.Table.logger.info(this._current);

		return;
	};

	readonly write = async () => {
		await this.onWrite();

		await this.Table.put({
			Item: { ...this._current, ...this.keys }
		});

		return this;
	};

	readonly create = async () => {
		await this.onWrite();
		await this.onCreate();

		await this.Table.create(this.key, {
			Item: { ...this._current, ...this.keys }
		});

		return this;
	};

	readonly update = async (props: Partial<A>) => {
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

		await this.Table.update<A>({
			Key: this.key,
			UpdateExpression,
			ExpressionAttributeValues
		});

		return this;
	};

	readonly delete = async () => {
		await this.onDelete();

		await this.Table.delete({
			Key: this.key
		});

		return;
	};
}
