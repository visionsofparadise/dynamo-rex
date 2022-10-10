import { IdxATL, IdxCfgSet, Table } from '../Table/Table';
import { OA } from '../utils';
import { QueryInput, QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';

export const allFn =
	<
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<string, IdxATL>,
		Item extends StaticItem<ISIdx | TPIdxN, TIdxCfg>
	>() =>
	<
		ListFunctionQuery extends OA<
			QueryInput<TPIdxN, ISIdx, Table<string, IdxATL, TPIdxN, TIdxCfg>['IndexKeyMap']>,
			'KeyConditionExpression' | 'ExpressionAttributeValues'
		>
	>(
		listFunction: (listQuery: ListFunctionQuery) => Promise<QueryOutput<InstanceType<Item>>>
	) => {
		return {
			query: async (listQuery: ListFunctionQuery) => {
				const getPages = async (
					internalListQuery: ListFunctionQuery
				): Promise<
					Pick<QueryOutput<InstanceType<Item>>, 'Items'> & {
						PageData: Array<Omit<QueryOutput<InstanceType<Item>>, 'Items'>>;
					}
				> => {
					const { Items, ...PageData } = await listFunction(internalListQuery);

					if (PageData.LastEvaluatedKey) {
						const moreData = await getPages({ ...internalListQuery, ExclusiveStartKey: PageData.LastEvaluatedKey });

						return {
							Items: [...Items, ...moreData.Items],
							PageData: [PageData, ...moreData.PageData]
						};
					} else {
						return {
							Items,
							PageData: [PageData]
						};
					}
				};

				return getPages(listQuery);
			}
		};
	};
