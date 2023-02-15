import { Table, IdxCfgM, IdxATL, IdxACfg, IdxP, NotPIdxN, TIdxN, PIdxCfg, IdxKey, IdxKeys } from '../Table/Table';
import { Constructor } from '../utils';
import { IdxAFns, ISIdxCfg, Item } from '../Item/Item';
import { PutItemInput, PutReturnValues } from '../Table/put';
import { DeleteItemInput } from '../Table/delete';
import { CreateItemInput } from '../Table/create';
import { UpdateItemInput, UpdateReturnValues } from '../Table/update';
import { O } from 'ts-toolbelt';
import { keyOfFn } from '../getters/keyOf';
import { assertRangeKeyIsOptional } from '../getters/assertRangeKeyIsOptional';
import { assertIndexNameIsNotPrimaryIndex } from '../getters/assertIndexNameIsNotPrimaryIndex';

export type KP<
	K extends keyof TIdxCfg,
	IIdxAFns extends IdxAFns<TIdxCfg>,
	TIdxCfg extends PIdxCfg,
	RKCfg = TIdxCfg[K]
> = RKCfg extends IdxACfg
	? Parameters<IIdxAFns[RKCfg['attribute']]>[0] extends undefined
		? void
		: Parameters<IIdxAFns[RKCfg['attribute']]>[0]
	: void;

export type HKRKP<
	IIdxAFns extends IdxAFns<TIdxCfg>,
	TIdxCfg extends PIdxCfg,
	HKPT = KP<'hashKey', IIdxAFns, TIdxCfg>,
	RKPT = KP<'rangeKey', IIdxAFns, TIdxCfg>
> = HKPT extends void ? (RKPT extends void ? void : RKPT) : RKPT extends void ? HKPT : HKPT & RKPT;

export const writers =
	<
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, TIdxA, TIdxATL, TIdxPA, TIdxP, TIdxCfgM>
	) =>
	<IA extends {}, ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>, IIdxAFns extends IdxAFns<TIdxCfgM[TPIdxN | ISIdxN]>>(
		Item: IIdxAFns & ISIdxCfg<ISIdxN> & Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	) => {
		const Index = Table.config.indexes[Table.config.primaryIndex];

		const hashKey = Index.hashKey.attribute;
		const rangeKey = Index.rangeKey ? Index.rangeKey.attribute : undefined;

		assertRangeKeyIsOptional<TPIdxN, TIdxCfgM>(rangeKey, Table.config.primaryIndex, Table.config.indexes);
		assertIndexNameIsNotPrimaryIndex<TPIdxN, TPIdxN>(undefined, Table.config.primaryIndex, Table.config.primaryIndex);

		const config = {
			index: Table.config.primaryIndex,
			hashKey,
			rangeKey,
			Index: undefined
		};

		const keyOf = keyOfFn<TPIdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);

		return {
			put: <RV extends PutReturnValues = never>(
				query: PutItemInput<IA & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>, RV, ISIdxN, TPIdxN, TIdxCfgM>
			) => Table.put<IA, RV>(query),

			create: <RV extends PutReturnValues = never>(
				query: CreateItemInput<IA & IdxKeys<TPIdxN | ISIdxN, TIdxCfgM>, RV, ISIdxN, TPIdxN, TIdxCfgM>
			) => Table.create<IA, RV>(query),

			delete: <RV extends PutReturnValues = never>(
				key: HKRKP<IIdxAFns, TIdxCfgM[TPIdxN]>,
				query?: Omit<DeleteItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>, 'Key'>
			) => {
				console.log(keyOf(key));
				return Table.delete<IA, RV, ISIdxN>(query ? { Key: keyOf(key), ...query } : { Key: keyOf(key) });
			},

			update: <RV extends UpdateReturnValues = 'ALL_NEW'>(
				key: HKRKP<IIdxAFns, TIdxCfgM[TPIdxN]>,
				query: Omit<UpdateItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>, 'Key'>
			) =>
				Table.update({
					Key: keyOf(key),
					...query
				}),

			updateFromObject: <RV extends UpdateReturnValues = 'ALL_NEW'>(
				key: HKRKP<IIdxAFns, TIdxCfgM[TPIdxN]>,
				object: O.Partial<IA, 'deep'>,
				query?: Omit<UpdateItemInput<IdxKey<TIdxCfgM[TPIdxN]>, RV>, 'Key'>
			) =>
				Table.updateFromObject(
					query
						? {
								Key: keyOf(key),
								...query
						  }
						: { Key: keyOf(key) },
					object
				)
		};
	};
