import { Table, IdxCfgSet, IdxATL, IdxACfg, IdxKey } from '../Table/Table';
import { constructObject, OptionalAttributes } from '../utils';
import { omit } from 'lodash';
import { StaticItem } from '../Item/Item';
import { getAllFn } from './getAll';
import { itemizeFn } from './itemize';
import { listMakerFn } from './listMaker';
import { QueryInput, QueryOutput } from '../Table/query';

export const getters =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		Table: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	<
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		Item extends StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	>(
		Item: Item & {
			secondaryIndexes: Array<ISIdx>;
		}
	) => {
		type ItemInst = InstanceType<typeof Item>;

		const itemize = itemizeFn<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg, Item>(Item);
		const listMaker = listMakerFn<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg, Item>(Item);

		const indexFunctions = <Idx extends TPIdxN | ISIdx>(index: Idx) => {
			type HKProps = Parameters<Item[TIdxCfg[Idx]['hashKey']['attribute']]>[0] extends undefined
				? void
				: Parameters<Item[TIdxCfg[Idx]['hashKey']['attribute']]>[0];

			type RKProps = TIdxCfg[Idx]['rangeKey'] extends IdxACfg<string, IdxATL>
				? Parameters<Item[TIdxCfg[Idx]['rangeKey']['attribute']]>[0] extends undefined
					? void
					: Parameters<Item[TIdxCfg[Idx]['rangeKey']['attribute']]>[0]
				: void;

			type HKRKProps = HKProps extends void
				? RKProps extends void
					? void
					: RKProps
				: RKProps extends void
				? HKProps
				: HKProps & RKProps;

			const Index = Table.config.indexes[index];

			const hashKey = Index.hashKey.attribute;
			const rangeKey = Index.rangeKey ? Index.rangeKey.attribute : undefined;

			const IndexName = index === (Table.config.primaryIndex as string) ? undefined : (index as Exclude<Idx, TPIdxN>);

			const keyOf = (props: HKRKProps): IdxKey<TIdxCfg[Idx]> => {
				const attributes = rangeKey ? [hashKey, rangeKey] : [hashKey];
				const values = attributes.map(attribute => Item[attribute](props));

				return constructObject(attributes, values);
			};

			const one = async (props: HKRKProps): Promise<ItemInst> => {
				const key = keyOf(props);

				return !IndexName
					? Table.get({ Key: key }).then(data => itemize(data.Item))
					: Table.query({
							IndexName,
							Limit: 1,
							KeyConditionExpression: `${hashKey} = :hashKey${rangeKey ? ` AND ${rangeKey} = :rangeKey` : ``}`,
							ExpressionAttributeValues: rangeKey
								? {
										[`:hashKey`]: key[hashKey],
										[`:rangeKey`]: key[rangeKey]
								  }
								: {
										[`:hashKey`]: key[hashKey]
								  }
					  }).then(async data => {
							if (!data.Items || data.Items.length === 0) throw new Error('Not Found');

							const items: Array<ItemInst> = await Promise.all(data.Items!.map(itemize));

							return items[0];
					  });
			};

			const query = (props: HKProps) => {
				const hashKeyValue = Item[hashKey](props);

				const hashKeyFn = async (
					listQuery?: OptionalAttributes<
						QueryInput<TPIdxN, ISIdx, TIdxCfg>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					>
				): Promise<QueryOutput<ItemInst>> =>
					Table.query({
						IndexName,
						KeyConditionExpression: `${hashKey} = :hashKey`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue
						},
						...(listQuery || {})
					}).then(listMaker);

				const startsWith = async (
					listQuery: OptionalAttributes<
						QueryInput<TPIdxN, ISIdx, TIdxCfg>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					> & {
						StartsWith: string | number;
					}
				): Promise<QueryOutput<ItemInst>> =>
					Table.query({
						IndexName,
						KeyConditionExpression: `${hashKey} = :hashKey AND begins_with(${rangeKey}, :startsWith)`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue,
							[`:startsWith`]: listQuery.StartsWith
						},
						...omit(listQuery, 'StartsWith')
					}).then(listMaker);

				const between = async (
					listQuery: OptionalAttributes<
						QueryInput<TPIdxN, ISIdx, TIdxCfg>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					> & { Min: string | number; Max: string | number }
				): Promise<QueryOutput<ItemInst>> =>
					Table.query({
						IndexName,
						KeyConditionExpression: `${hashKey} = :hashKey AND ${rangeKey} BETWEEN :min AND :max`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue,
							[`:min`]: listQuery.Min,
							[`:max`]: listQuery.Max
						},
						...omit(listQuery, 'Min', 'Max')
					}).then(listMaker);

				return {
					hashKey: hashKeyFn,
					startsWith,
					between
				};
			};

			const queryAll = (props: HKProps) => {
				const queryFns = query(props);

				const getAll = getAllFn<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg, Item>();

				return {
					hashKey: getAll(queryFns.hashKey),
					startsWith: getAll(queryFns.startsWith),
					between: getAll(queryFns.between)
				};
			};

			return {
				keyOf,
				one,
				query,
				queryAll
			};
		};

		const indexFunctionSet: { [x in ISIdx]: ReturnType<typeof indexFunctions<x>> } = constructObject(
			Item.secondaryIndexes,
			Item.secondaryIndexes.map(index => indexFunctions(index))
		);

		const gettersBase = indexFunctions(Table.config.primaryIndex).one;

		const gettersObject = Object.assign(gettersBase, {
			...indexFunctions(Table.config.primaryIndex),
			...indexFunctionSet
		});

		return gettersObject;
	};
