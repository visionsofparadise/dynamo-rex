import { QueryInput, QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';
import { Table, IdxCfgSet, IdxATL, IdxATLToType, IdxACfg } from '../Table/Table';
import { OA } from '../utils';
import { listMakerFn } from './listMaker';

export const betweenFn =
	<
		Idx extends ISIdx | TPIdxN,
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<Idx, TIdxCfg>
	>(
		Table: Table<string, IdxATL, TPIdxN, TIdxCfg>,
		Item: Item,
		config: {
			hashKey: TIdxCfg[Idx]['hashKey']['attribute'];
			hashKeyValue: IdxATLToType<TIdxCfg[Idx]['hashKey']['type']>;
			rangeKey: TIdxCfg[Idx]['rangeKey'] extends IdxACfg<string, IdxATL>
				? TIdxCfg[Idx]['rangeKey']['attribute']
				: undefined;
			IndexName: Exclude<Idx, TPIdxN> | undefined;
		}
	) =>
	async (
		listQuery: OA<
			QueryInput<TPIdxN, ISIdx, typeof Table['IndexKeyMap']>,
			'KeyConditionExpression' | 'ExpressionAttributeValues'
		> & {
			Min: string | number;
			Max: string | number;
		}
	): Promise<QueryOutput<InstanceType<typeof Item>>> => {
		const { hashKey, hashKeyValue, rangeKey, IndexName } = config;

		const { Min, Max, ...restOfQuery } = listQuery;

		const listMaker = listMakerFn<Idx, TIdxCfg, Item>(Item);

		return Table.query({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey AND ${rangeKey} BETWEEN :min AND :max`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue,
				[`:min`]: Min,
				[`:max`]: Max
			},
			...restOfQuery
		}).then(listMaker);
	};
