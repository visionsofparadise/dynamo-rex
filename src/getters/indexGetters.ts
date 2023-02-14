import { IdxAFns } from '../Item/Item';
import { Table, IdxCfgM, IdxATL, IdxACfg, IdxATLToType, IdxP, TIdxN, NotPIdxN } from '../Table/Table';
import { KP } from './getters';
import { keyOfFn } from './keyOf';
import { oneFn } from './one';
import { hashKeyOnlyFn } from './hashKeyOnly';
import { startsWithFn } from './startsWith';
import { betweenFn } from './between';
import { assertRangeKeyIsOptional } from './assertRangeKeyIsOptional';
import { assertIndexNameIsNotPrimaryIndex } from './assertIndexNameIsNotPrimaryIndex';
import { OA } from '../utils';
import { QueryInput } from '../Table/query';

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
> = Omit<OA<QueryInput<IdxN, TPIdxN, TIdxCfgM>, 'KeyConditionExpression' | 'ExpressionAttributeValues'>, 'IndexName'>;

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
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns
	) =>
	<IdxN extends TPIdxN | ISIdxN>(
		index: IdxN
	): {
		keyOf: ReturnType<typeof keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>>;
		one: ReturnType<typeof oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>>;
		query: (data: KP<'hashKey', IIdxAFns, TIdxCfgM[IdxN]>) => {
			hashKeyOnly: ReturnType<typeof hashKeyOnlyFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>>;
			startsWith: ReturnType<typeof startsWithFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>>;
			between: ReturnType<typeof betweenFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>>;
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

		const query = (data: KP<'hashKey', IIdxAFns, TIdxCfgM[IdxN]>) => {
			const queryConfig = {
				...config,
				hashKeyValue: Item[hashKey](data)
			};

			return {
				hashKeyOnly: hashKeyOnlyFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>(Table, queryConfig),
				startsWith: startsWithFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>(Table, queryConfig),
				between: betweenFn<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>(Table, queryConfig)
			};
		};

		return {
			keyOf: keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config),
			one: oneFn<IA, IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxPA, TIdxP, TIdxCfgM>(Table, Item, config),
			query
		};
	};
