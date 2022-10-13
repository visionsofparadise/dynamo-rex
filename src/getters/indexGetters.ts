import { IdxAFns, Item } from '../Item/Item';
import { Table, IdxCfgM, IdxATL, IdxACfg, IdxATLToType, IdxP, TIdxN, NotPIdxN } from '../Table/Table';
import { HKP } from './getters';
import { keyOfFn } from './keyOf';
import { oneFn } from './one';
import { hashKeyOnlyFn } from './hashKeyOnly';
import { startsWithFn } from './startsWith';
import { betweenFn } from './between';
import { assertRangeKeyIsOptional } from './assertRangeKeyIsOptional';
import { assertIndexNameIsNotPrimaryIndex } from './assertIndexNameIsNotPrimaryIndex';
import { Constructor, OA } from '../utils';
import { QueryInput, QueryOutput } from '../Table/query';

export interface GetterCfg<
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM
> {
	index: IdxN;
	hashKey: TIdxCfgM[IdxN]['hashKey']['attribute'];
	rangeKey: TIdxCfgM[IdxN]['rangeKey'] extends IdxACfg<string, IdxATL>
		? TIdxCfgM[IdxN]['rangeKey']['attribute']
		: undefined;
	IndexName?: Exclude<IdxN, TPIdxN>;
}

export interface QueryGetterCfg<
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM
> extends GetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM> {
	hashKeyValue: IdxATLToType<TIdxCfgM[IdxN]['hashKey']['type']>;
}

export type QueryIdxN<
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = IdxN extends TPIdxN ? never : IdxN;

export type GetterQueryInput<
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM> | never,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL>
> = Omit<OA<QueryInput<IdxN, TPIdxN, TIdxCfgM>, 'KeyConditionExpression' | 'ExpressionAttributeValues'>, 'IndexName'>;

export type GetterQueryItemsOutput<
	IA extends {},
	IdxN extends TPIdxN | ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxPA extends string,
	TIdxP extends IdxP<TIdxPA>,
	TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
	GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
> = Omit<QueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>, 'Items'> & {
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
		: QueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>
	: GetterQueryItemsOutput<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>;

export const indexGettersFn =
	<
		IA extends {},
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<TPIdxN | ISIdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns & Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	) =>
	<IdxN extends TPIdxN | ISIdxN>(
		index: IdxN
	): {
		keyOf: ReturnType<typeof keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>>;
		one: ReturnType<typeof oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>>;
		query: (props: HKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>) => {
			hashKeyOnly: ReturnType<typeof hashKeyOnlyFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>>;
			startsWith: ReturnType<typeof startsWithFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>>;
			between: ReturnType<typeof betweenFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>>;
		};
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

		const query = (props: HKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>) => {
			const queryConfig = {
				...config,
				hashKeyValue: Item[hashKey](props)
			};

			return {
				hashKeyOnly: hashKeyOnlyFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>(
					Table,
					Item,
					queryConfig
				),
				startsWith: startsWithFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>(
					Table,
					Item,
					queryConfig
				),
				between: betweenFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>(Table, Item, queryConfig)
			};
		};

		return {
			keyOf: keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config),
			one: oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, typeof Item>(Table, Item, config),
			query
		};
	};
