import { Item } from '../Item/Item';
import { Constructor } from '../utils';
import { Table, IdxCfgM, IdxATL, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { assertQueryOutputItemType } from './assertQueryOutputItemType';
import { QueryGetterCfg, GetterQueryInput, QueryIdxN, GetterQueryOutput } from './indexGetters';

export const betweenFn =
	<
		IA extends {},
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>,
		GItem extends Constructor<Item<IA, ISIdxN, TPIdxN, string, IdxATL, TIdxCfgM>>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: GItem,
		config: QueryGetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		listQuery: GetterQueryInput<QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM> & {
			Min: string | number;
			Max: string | number;
		}
	): Promise<
		GetterQueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>
	> => {
		const { hashKey, hashKeyValue, rangeKey, IndexName } = config;

		const { Min, Max, ...restOfQuery } = listQuery;

		let output = await Table.query<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey AND ${rangeKey} BETWEEN :min AND :max`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue,
				[`:min`]: Min,
				[`:max`]: Max
			},
			...restOfQuery
		});

		let isItems = false;

		if (!Table.config.indexes[config.index].project) {
			output = Object.assign(output, {
				Items: output.Items.map(item => new Item(item))
			});

			isItems = true;
		}

		assertQueryOutputItemType<IA, IdxN, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>(output, isItems, config, Table);

		return output;
	};
