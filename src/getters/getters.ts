import { Key, ConsumedCapacity } from 'aws-sdk/clients/dynamodb';
import { IdxCfgProps } from '../Table/Table';
import { QueryOutput } from '../Table/methods/query';
import { IdxALiteral } from '../Index/Index';
import { constructObject, ILogger } from '../utils';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { get } from '../Table/methods/get';
import { query as _query } from '../Table/methods/query';

export interface ItemListQuery {
	sortOrder?: 'ASC' | 'DESC';
	limit?: number;
	cursor?: Key;
}

export interface ItemList<Item> {
	items: Array<Item>;
	cursor?: Key;
	count?: number;
	scannedCount?: number;
	consumedCapacity?: ConsumedCapacity;
}

export const getters =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		client: DocumentClient,
		tableConfig: { name: string; primaryIndex: TPIdxN; logger?: ILogger },
		indexConfig: IdxCfg
	) =>
	<
		IIdx extends Array<Exclude<TIdxN, TPIdxN>>,
		Item extends { [x in keyof IdxCfg[IIdx[number]]['key']]: (props: any) => IdxCfg[IIdx[number]]['key'][x] } & {
			[x in keyof IdxCfg[TPIdxN]['key']]: (props: any) => IdxCfg[TPIdxN]['key'][x];
		}
	>(
		Item: Item & {
			secondaryIndices: IIdx;

			new (...args: any): any;
		}
	) => {
		type ItemInst = InstanceType<typeof Item>;

		const indexFunctions = <Idx extends IIdx[number] | TPIdxN>(index: Idx) => {
			type HKParams = Parameters<Item[IdxCfg[Idx]['hashKey']]>[0];
			type RKParams = Parameters<Item[IdxCfg[Idx]['rangeKey']]>[0];
			type HKSKParams = (HKParams extends undefined ? object : HKParams) &
				(RKParams extends undefined ? object : RKParams);

			const Index = indexConfig[index];

			const hashKey = Index.hashKey;
			const rangeKey = Index.rangeKey;

			const IndexName = index !== 'primary' ? String(index) : undefined;

			const tableQuery = _query(client, tableConfig.name, tableConfig.logger);

			const keyOf = (params: HKSKParams): IdxCfg[Idx]['key'] => {
				return constructObject([hashKey, rangeKey], [Item[hashKey](params), Item[rangeKey](params)]);
			};

			const one = async (params: HKSKParams): Promise<ItemInst> => {
				const key = keyOf(params);

				if (!key[rangeKey]) throw new Error('Not Found');

				return !IndexName
					? get(client, tableConfig.name, tableConfig.logger)({ Key: key }).then(data => new Item(data.Item))
					: tableQuery({
							IndexName,
							Limit: 1,
							KeyConditionExpression: `${String(hashKey)} = :hashKey AND ${String(rangeKey)} = :rangeKey`,
							ExpressionAttributeValues: {
								[`:hashKey`]: key[hashKey],
								[`:rangeKey`]: key[rangeKey]
							}
					  }).then(data => {
							if (!data.Items || data.Items.length === 0) throw new Error('Not Found');

							const items: Array<ItemInst> = data.Items!.map(itemData => new Item(itemData));

							return items[0];
					  });
			};

			const listQueryParams = (query: ItemListQuery) => ({
				IndexName,
				Limit: (query.limit && query.limit > 1000 ? 1000 : query.limit) || 1000,
				ScanIndexForward: query.sortOrder === 'ASC',
				ExclusiveStartKey: query.cursor
			});

			const listMaker = <DatabaseItem extends object>(data: QueryOutput<DatabaseItem>) => {
				let items: Array<ItemInst> = data.Items.map(itemData => new Item(itemData));

				return {
					items,
					cursor: data.LastEvaluatedKey,
					count: data.Count,
					scannedCount: data.ScannedCount,
					consumedCapacity: data.ConsumedCapacity
				};
			};

			const fallbackListQuery = { sortOrder: undefined, limit: undefined, cursor: undefined };

			const query = (params?: HKParams) => {
				const hashKeyValue = Item[hashKey](params);

				const hashKeyFn = async (listQuery?: ItemListQuery): Promise<ItemList<ItemInst>> =>
					tableQuery({
						...listQueryParams(listQuery || fallbackListQuery),
						KeyConditionExpression: `${String(hashKey)} = :hashKey`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue
						}
					}).then(listMaker);

				const startsWith = async (listQuery: ItemListQuery & { value: string | number }): Promise<ItemList<ItemInst>> =>
					tableQuery({
						...listQueryParams(listQuery),
						KeyConditionExpression: `${String(hashKey)} = :hashKey AND begins_with(${String(rangeKey)}, :startsWith)`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue,
							[`:startsWith`]: listQuery.value
						}
					}).then(listMaker);

				const between = async (
					listQuery: ItemListQuery & { min: string | number; max: string | number }
				): Promise<ItemList<ItemInst>> =>
					tableQuery({
						...listQueryParams(fallbackListQuery),
						KeyConditionExpression: `${String(hashKey)} = :hashKey AND ${String(rangeKey)} BETWEEN :min AND :max`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue,
							[`:min`]: listQuery.min,
							[`:max`]: listQuery.max
						}
					}).then(listMaker);

				return {
					hashKey: hashKeyFn,
					startsWith,
					between
				};
			};

			const queryAll = (params: HKParams) => {
				const queryFns = query(params);

				const getAll =
					<ListFunctionParams>(listFunction: (listParams: ListFunctionParams) => Promise<ItemList<ItemInst>>) =>
					async (listQuery: ItemListQuery & ListFunctionParams): Promise<Omit<ItemList<ItemInst>, 'cursor'>> => {
						const getPages = async (
							internalListQuery: ItemListQuery & ListFunctionParams
						): Promise<ItemList<ItemInst>> => {
							const data = await listFunction(listQuery);

							if (data.cursor) {
								const moreData = await getPages(internalListQuery);

								return {
									items: [...data.items, ...moreData.items],
									count: (data.count || 0) + (moreData.count || 0),
									scannedCount: (data.scannedCount || 0) + (moreData.scannedCount || 0),
									consumedCapacity: {
										...data.consumedCapacity,
										ReadCapacityUnits:
											(data.consumedCapacity ? data.consumedCapacity.ReadCapacityUnits || 0 : 0) +
											(moreData.consumedCapacity ? moreData.consumedCapacity.ReadCapacityUnits || 0 : 0),
										WriteCapacityUnits:
											(data.consumedCapacity ? data.consumedCapacity.WriteCapacityUnits || 0 : 0) +
											(moreData.consumedCapacity ? moreData.consumedCapacity.WriteCapacityUnits || 0 : 0)
									}
								};
							} else {
								return data;
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

		return Object.assign(indexFunctions(tableConfig.primaryIndex).one, {
			...indexFunctions(tableConfig.primaryIndex),
			...indexFunctionSet
		});
	};
