import { IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN, Table } from '../Table/Table';
import { QueryGetterCfg, GetterQueryInput, QueryIdxN, GetterQueryOutput } from './indexGetters';
import { assertQueryOutputItemType } from './assertQueryOutputItemType';
import { Constructor } from '../utils';
import { Item } from '../Item/Item';

export const hashKeyOnlyFn =
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
		config: QueryGetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		listQuery?: GetterQueryInput<QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, TPIdxN, TIdxCfgM>
	): Promise<
		GetterQueryOutput<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxPA, TIdxP, TIdxCfgM, GItem>
	> => {
		const { hashKey, hashKeyValue, IndexName } = config;

		let output = await Table.query<IA, QueryIdxN<IdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue
			},
			...(listQuery || {})
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
