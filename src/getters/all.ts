import { QueryOutput } from '../Table/query';

type QueryAllOutput<ListQueryReturn extends QueryOutput<any>> = Pick<ListQueryReturn, 'Items'> & {
	PageData: Array<Omit<ListQueryReturn, 'Items'>>;
};

export const all = <ListFunctionQuery, ListQueryReturn extends QueryOutput<any>>(
	listFunction: (listFunctionQuery: ListFunctionQuery) => Promise<ListQueryReturn>
) => {
	return {
		query: async (listAllQuery: ListFunctionQuery) => {
			const queryAll = async (listQuery: ListFunctionQuery): Promise<QueryAllOutput<ListQueryReturn>> => {
				const { Items, ...PageData } = await listFunction(listQuery);

				if (PageData.LastEvaluatedKey) {
					const moreData = await queryAll({ ...listQuery, ExclusiveStartKey: PageData.LastEvaluatedKey });

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

			return queryAll(listAllQuery);
		}
	};
};
