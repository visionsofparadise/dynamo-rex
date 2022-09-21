import { IdxCfgProps, Table } from '../Table/Table';
import { QueryInput, QueryOutput } from '../Table/methods/query';
import { IdxALiteral } from '../Index/Index';
import { constructObject, OptionalAttribtues } from '../utils';
import { get } from '../Table/methods/get';
import { query as _query } from '../Table/methods/query';
import _chunk from 'lodash/chunk';
import { omit } from 'lodash';

export const getters =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	<
		IIdx extends Array<Exclude<TIdxN, TPIdxN>>,
		Item extends { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
			[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
		} & { new (...args: any[]): any }
	>(
		Item: Item & {
			secondaryIndices: IIdx;
		}
	) => {
		type ItemInst = InstanceType<typeof Item>;

		const indexFunctions = <Idx extends Exclude<TIdxN, TPIdxN> | TPIdxN>(index: Idx) => {
			type HKParams = Parameters<Item[IdxCfg[Idx]['hashKey']]>[0];
			type RKParams = Parameters<Item[IdxCfg[Idx]['rangeKey']]>[0];
			type HKRKarams = (HKParams extends undefined ? object : HKParams) &
				(RKParams extends undefined ? object : RKParams);

			const Index = Table.indexConfig[index];

			const hashKey = Index.hashKey;
			const rangeKey = Index.rangeKey;

			const IndexName = (index === (Table.tableConfig.primaryIndex as string) ? undefined : index) as
				| Exclude<TIdxN, TPIdxN>
				| undefined;

			const tableQuery = _query(Table);

			const keyOf = (params: HKRKarams): IdxCfg[Idx]['key'] => {
				return constructObject([hashKey, rangeKey], [Item[hashKey](params), Item[rangeKey](params)]);
			};

			const itemize = async (data: unknown): Promise<ItemInst> => {
				const item = new Item(data);

				await item.onGet();

				return item;
			};

			const one = async (params: HKRKarams): Promise<ItemInst> => {
				const key = keyOf(params);

				if (!key[rangeKey]) throw new Error('Not Found');

				return !IndexName
					? get(Table)({ Key: key }).then(data => itemize(data.Item))
					: tableQuery({
							IndexName,
							Limit: 1,
							KeyConditionExpression: `${String(hashKey)} = :hashKey AND ${String(rangeKey)} = :rangeKey`,
							ExpressionAttributeValues: {
								[`:hashKey`]: key[hashKey],
								[`:rangeKey`]: key[rangeKey]
							}
					  }).then(async data => {
							if (!data.Items || data.Items.length === 0) throw new Error('Not Found');

							const items: Array<ItemInst> = await Promise.all(data.Items!.map(itemize));

							return items[0];
					  });
			};

			const listMaker = async <A extends object>(data: QueryOutput<A>) => {
				const batches = _chunk(data.Items, 10);

				let items: Array<ItemInst> = [];

				for (const batch of batches) {
					const newItems = await Promise.all(batch.map(itemize));

					items = [...items, ...newItems];
				}

				return {
					...data,
					Items: items
				};
			};

			const query = (params?: HKParams) => {
				const hashKeyValue = Item[hashKey](params);

				const hashKeyFn = async (
					listQuery?: OptionalAttribtues<
						QueryInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, Exclude<TIdxN, TPIdxN>>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					>
				): Promise<QueryOutput<ItemInst>> =>
					tableQuery({
						IndexName,
						KeyConditionExpression: `${String(hashKey)} = :hashKey`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue
						},
						...(listQuery || {})
					}).then(listMaker);

				const startsWith = async (
					listQuery: OptionalAttribtues<
						QueryInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, Exclude<TIdxN, TPIdxN>>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					> & {
						StartsWith: string | number;
					}
				): Promise<QueryOutput<ItemInst>> =>
					tableQuery({
						IndexName,
						KeyConditionExpression: `${String(hashKey)} = :hashKey AND begins_with(${String(rangeKey)}, :startsWith)`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue,
							[`:startsWith`]: listQuery.StartsWith
						},
						...omit(listQuery, 'StartsWith')
					}).then(listMaker);

				const between = async (
					listQuery: OptionalAttribtues<
						QueryInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, Exclude<TIdxN, TPIdxN>>,
						'KeyConditionExpression' | 'ExpressionAttributeValues'
					> & { Min: string | number; Max: string | number }
				): Promise<QueryOutput<ItemInst>> =>
					tableQuery({
						IndexName,
						KeyConditionExpression: `${String(hashKey)} = :hashKey AND ${String(rangeKey)} BETWEEN :min AND :max`,
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

			const queryAll = (params?: HKParams) => {
				const queryFns = query(params);

				const getAll =
					<
						ListFunctionQuery extends OptionalAttribtues<
							QueryInput<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg, Exclude<TIdxN, TPIdxN>>,
							'KeyConditionExpression' | 'ExpressionAttributeValues'
						>
					>(
						listFunction: (listQuery: ListFunctionQuery) => Promise<QueryOutput<ItemInst>>
					) =>
					async (
						listQuery: ListFunctionQuery
					): Promise<Pick<QueryOutput<ItemInst>, 'Items'> & { Pages: Array<Omit<QueryOutput<ItemInst>, 'Items'>> }> => {
						const getPages = async (
							internalListQuery: ListFunctionQuery
						): Promise<
							Pick<QueryOutput<ItemInst>, 'Items'> & { Pages: Array<Omit<QueryOutput<ItemInst>, 'Items'>> }
						> => {
							const data = await listFunction(internalListQuery);

							if (data.LastEvaluatedKey) {
								const moreData = await getPages({ ...internalListQuery, ExclusiveStartKey: data.LastEvaluatedKey });

								return {
									Items: [...data.Items, ...moreData.Items],
									Pages: [omit(data, 'Items'), ...moreData.Pages]
								};
							} else {
								return {
									Items: data.Items,
									Pages: [omit(data, 'Items')]
								};
							}
						};

						return getPages(listQuery);
					};

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

		const indexFunctionSet: { [x in IIdx[number]]: ReturnType<typeof indexFunctions<x>> } = constructObject(
			Item.secondaryIndices,
			Item.secondaryIndices.map(index => indexFunctions(index))
		);

		return Object.assign(indexFunctions(Table.tableConfig.primaryIndex).one, {
			...indexFunctions(Table.tableConfig.primaryIndex),
			...indexFunctionSet
		});
	};
