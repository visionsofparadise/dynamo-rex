import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { constructObject, ILogger } from '../utils';
import { _delete } from '../Table/methods/delete';
import { update } from '../Table/methods/update';
import { create } from '../Table/methods/create';
import { put } from '../Table/methods/put';
import { IdxALiteral } from '../Index/Index';
import { IdxCfgProps } from '../Table/Table';

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
	indexFunctions: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
		[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
	};

	client: DocumentClient;
	tableConfig: { name: string; primaryIndex: TPIdxN; logger?: ILogger };
	indexConfig: IdxCfg;

	readonly _initial: A;
	_current: A;

	constructor(
		props: A,
		secondaryIndices: IIdx,
		indexFunctions: { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
			[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
		},
		client: DocumentClient,
		tableConfig: { name: string; primaryIndex: TPIdxN; logger?: ILogger },
		indexConfig: IdxCfg
	) {
		this._initial = props;
		this._current = props;

		this.secondaryIndices = secondaryIndices;
		this.indexFunctions = indexFunctions;

		this.client = client;
		this.tableConfig = tableConfig;
		this.indexConfig = indexConfig;

		this.onNew();
	}

	get key(): IdxCfg[TPIdxN]['key'] {
		const index = this.indexConfig[this.tableConfig.primaryIndex];

		const attributes = [index.hashKey, index.rangeKey];
		const values = attributes.map(attribute => this.indexFunctions[attribute](this._current));

		return constructObject(attributes, values);
	}

	indexKey = <Idx extends IIdx[number]>(index: Idx): IdxCfg[Idx]['key'] => {
		const secondaryIndex = this.indexConfig[index];

		const attributes = [secondaryIndex.hashKey, secondaryIndex.rangeKey];
		const values = attributes.map(attribute => this.indexFunctions[attribute](this._current));

		return constructObject(attributes, values);
	};

	get keys(): IdxCfg[IIdx[number]]['key'] & IdxCfg[TPIdxN]['key'] {
		const secondaryIndices = this.secondaryIndices.map(index => this.indexConfig[index]);

		const attributes = _flatten(secondaryIndices.map(index => [index.hashKey, index.rangeKey]));
		const values = attributes.map(attribute => this.indexFunctions[attribute](this._current));

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

	readonly onNew = () => {};
	readonly onSet = async () => {};
	readonly onWrite = async () => {};
	readonly onCreate = async () => {};
	readonly onDelete = async () => {};

	readonly set = async (props: Partial<A>) => {
		await this.onSet();

		this._current = { ...this._current, ...props };

		if (this.tableConfig.logger) this.tableConfig.logger.info(this._current);

		return;
	};

	readonly write = async () => {
		await this.onWrite();

		await put(
			this.client,
			this.tableConfig.name,
			this.tableConfig.logger
		)({
			Item: { ...this._current, ...this.keys }
		});

		return this;
	};

	readonly create = async () => {
		await this.onWrite();
		await this.onCreate();

		await create(
			this.client,
			this.tableConfig.name,
			this.tableConfig.logger
		)(this.key, {
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

		await update(
			this.client,
			this.tableConfig.name,
			this.tableConfig.logger
		)<A>({
			Key: this.key,
			UpdateExpression,
			ExpressionAttributeValues
		});

		return this;
	};

	readonly delete = async () => {
		await this.onDelete();

		await _delete(
			this.client,
			this.tableConfig.name,
			this.tableConfig.logger
		)({
			Key: this.key
		});

		return;
	};
}
