import { IdxATL, IdxATLToType, IdxCfgSet, Table } from '../Table/Table';
import { QueryInput, QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';
import { OA } from '../utils';
import { listMakerFn } from './listMaker';

export const hashKeyOnlyFn =
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
			IndexName: Exclude<Idx, TPIdxN> | undefined;
		}
	) =>
	async (
		listQuery?: OA<
			QueryInput<TPIdxN, ISIdx, typeof Table['IndexKeyMap']>,
			'KeyConditionExpression' | 'ExpressionAttributeValues'
		>
	): Promise<QueryOutput<InstanceType<typeof Item>>> => {
		const { hashKey, hashKeyValue, IndexName } = config;

		const listMaker = listMakerFn<Idx, TIdxCfg, Item>(Item);

		return Table.query({
			IndexName,
			KeyConditionExpression: `${hashKey} = :hashKey`,
			ExpressionAttributeValues: {
				[`:hashKey`]: hashKeyValue
			},
			...(listQuery || {})
		}).then(listMaker);
	};
