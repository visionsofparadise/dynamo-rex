import { IdxAFns, Item } from '../Item/Item';
import { Table, IdxCfgM, IdxATL, IdxACfg, IdxATLToType, IdxP, TIdxN, NotPIdxN } from '../Table/Table';
import { KP } from './getters';
import { keyOfFn } from './keyOf';
import { oneFn } from './one';
import { assertRangeKeyIsOptional } from './assertRangeKeyIsOptional';
import { assertIndexNameIsNotPrimaryIndex } from './assertIndexNameIsNotPrimaryIndex';
import { Constructor, OA } from '../utils';
import { QueryInput, QueryOutput } from '../Table/query';
import { assertQueryOutputItemType } from './assertQueryOutputItemType';
import { createRangeKeyQuery } from './createRangeQuery';

export interface GetterCfg<IdxN extends TIdxN<TIdxCfgM>, TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM> {
	index: IdxN;
	hashKey: TIdxCfgM[IdxN]['hashKey']['attribute'];
	rangeKey: TIdxCfgM[IdxN]['rangeKey'] extends IdxACfg ? TIdxCfgM[IdxN]['rangeKey']['attribute'] : undefined;
	IndexName?: Exclude<IdxN, TPIdxN>;
}

export interface QueryGetterCfg<IdxN extends TIdxN<TIdxCfgM>, TPIdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM>
	extends GetterCfg<IdxN, TPIdxN, TIdxCfgM> {
	hashKeyValue: IdxATLToType<TIdxCfgM[IdxN]['hashKey']['type']>;
}

export type QueryIdxN<
	IdxN extends TIdxN<TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = IdxN extends TPIdxN ? never : IdxN;

export type GetterQueryInput<
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Omit<
	OA<QueryInput<IdxN, TPIdxN, TIdxCfgM>, 'KeyConditionExpression' | 'ExpressionAttributeValues'>,
	'IndexName'
> & {
	BeginsWith?: string | number;
	Min?: string | number;
	Max?: string | number;
};

export type GetterQueryItemsOutput<
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
> = Omit<QueryOutput<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>, 'Items'> & {
	Items: Array<InstanceType<GItem>>;
};

export type GetterQueryOutput<
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
> = TIdxCfgM[IdxN]['project'] extends never[] | string[]
	? TIdxCfgM[IdxN]['project'] extends never
		? GetterQueryItemsOutput<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>
		: QueryOutput<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>
	: GetterQueryItemsOutput<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>;

export const indexGettersFn =
	<
		IA extends {},
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<TIdxCfgM[TPIdxN | ISIdxN]>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP>,
		GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	>(
		Table: Table<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns & GItem
	) =>
	<IdxN extends TPIdxN | ISIdxN>(
		index: IdxN
	): {
		keyOf: ReturnType<typeof keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>>;
		one: ReturnType<typeof oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>>;
		query: (
			hashKeyParams?: KP<'hashKey', IIdxAFns, TIdxCfgM[IdxN]>,
			rangeKeyParams?: GetterQueryInput<QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM>
		) => Promise<
			GetterQueryOutput<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>
		>;
	} => {
		const Index = Table.config.indexes[index];

		const hashKey = Index.hashKey.attribute;
		const rangeKey = Index.rangeKey ? Index.rangeKey.attribute : undefined;
		const IndexName = index === (Table.config.primaryIndex as string) ? undefined : index;

		assertRangeKeyIsOptional<IdxN, TIdxCfgM>(rangeKey, index, Table.config.indexes);
		assertIndexNameIsNotPrimaryIndex<IdxN, TPIdxN>(IndexName, index, Table.config.primaryIndex);

		const config = {
			index,
			hashKey,
			rangeKey,
			IndexName
		};

		const query = async (
			hashKeyParams?: KP<'hashKey', IIdxAFns, TIdxCfgM[IdxN]>,
			rangeKeyParams?: GetterQueryInput<QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM>
		) => {
			const hashKeyValue = Item[hashKey](hashKeyParams);

			const { BeginsWith, Min, Max, ...restOfQuery } = rangeKeyParams || {};

			const rangeKeyQuery = createRangeKeyQuery(rangeKey, rangeKeyParams || {});

			let output = await Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
				IndexName,
				...restOfQuery,
				KeyConditionExpression: `${hashKey} = :hashKey ${rangeKeyQuery.KeyConditionExpression}`,
				ExpressionAttributeValues: {
					[`:hashKey`]: hashKeyValue,
					...rangeKeyQuery.ExpressionAttributeValues
				}
			});

			let isItems = false;

			if (!Table.config.indexes[config.index].project) {
				output = Object.assign(output, {
					Items: output.Items.map(item => new Item(item))
				});

				isItems = true;
			}

			assertQueryOutputItemType<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>(
				output,
				isItems,
				{ hashKey, hashKeyValue, index, rangeKey, IndexName },
				Table
			);

			return output;
		};

		return {
			keyOf: keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config),
			one: oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>(Table, Item, config),
			query
		};
	};
