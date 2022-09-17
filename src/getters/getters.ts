import { Key, ConsumedCapacity } from 'aws-sdk/clients/dynamodb';
import { Table, TCfgProps } from '../Table/Table';
import { QueryOutput } from '../Table/methods/query';
import { IdxAType } from '../Index/Index';
import { constructObject } from '../utils';
import { SelfItem } from '../Item/Item';

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

export const getters = <
	TIdx extends PropertyKey,
	TPIdx extends TIdx,
	TIdxA extends PropertyKey,
	TIdxAType extends IdxAType,
	TCfg extends TCfgProps<TIdx, TPIdx, TIdxA, TIdxAType>
>(
	Table: Table<TIdx, TPIdx, TIdxA, TIdxAType, TCfg>
) => {
	return <ISIdx extends typeof Table.SecondaryIndex, Item extends SelfItem<TIdx, TPIdx, ISIdx, TIdxA, TIdxAType, TCfg>>(
		Item: Item
	) => {
		type ItemInst = InstanceType<Item>;

		const indexFunctions = <Idx extends ISIdx | TPIdx>(index: Idx) => {
			type HKParams = Parameters<Item[TCfg['indices'][Idx]['attributes']['hashKey']]>[0];
			type HKSKParams = Parameters<
				Item[TCfg['indices'][Idx]['attributes']['hashKey']] & Item[TCfg['indices'][Idx]['attributes']['rangeKey']]
			>[0];

			const Index = Table.indices[index];

			const hashKey = Index.attributes.hashKey;
			const rangeKey = Index.attributes.rangeKey;

			const IndexName = index !== 'primary' ? String(index) : undefined;

			const keyOf = (params: HKSKParams): TCfg['indices'][Idx]['types']['key'] => {
				return constructObject([hashKey, rangeKey], [Item[hashKey](params), Item[rangeKey](params)]);
			};

			const one = async (params: HKSKParams): Promise<ItemInst> => {
				const key = keyOf(params);

				if (!key[rangeKey]) throw new Error('Not Found');

				return !IndexName
					? Table.get({ Key: key }).then(data => new Item(data.Item))
					: Table.query({
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
				const hashKeyValue = Item[Index.attributes.hashKey](params);

				const hashKeyFn = async (listQuery?: ItemListQuery): Promise<ItemList<ItemInst>> =>
					Table.query({
						...listQueryParams(listQuery || fallbackListQuery),
						KeyConditionExpression: `${String(hashKey)} = :hashKey`,
						ExpressionAttributeValues: {
							[`:hashKey`]: hashKeyValue
						}
					}).then(listMaker);

				const startsWith = async (listQuery: ItemListQuery & { value: string | number }): Promise<ItemList<ItemInst>> =>
					Table.query({
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
					Table.query({
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

		const secondaryIndexNames = Item['secondaryIndices'].map(index => index.name);

		const indexFunctionSet: {
			[x in ISIdx]: ReturnType<typeof indexFunctions<x>>;
		} = constructObject(
			secondaryIndexNames,
			secondaryIndexNames.map(index => indexFunctions(index))
		);

		return Object.assign(indexFunctions(Table.primaryIndex).one, {
			...indexFunctions(Table.primaryIndex),
			...indexFunctionSet
		});
	};
};
