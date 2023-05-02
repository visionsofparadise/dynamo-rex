import { QueryOutput } from '../Table/query';

type QueryAllOutput<ListQueryReturn extends QueryOutput<any, never, never, any, any>> = Pick<
	ListQueryReturn,
	'Items'
> & {
	PageData: Array<Omit<ListQueryReturn, 'Items'>>;
};

export const all = <
	ListFunctionParams,
	ListFunctionQuery,
	ListQueryReturn extends QueryOutput<any, never, never, any, any>
>(
	listFunction: (
		listFunctionParams: ListFunctionParams,
		listFunctionQuery: ListFunctionQuery
	) => Promise<ListQueryReturn>
) => {
	return {
		query: async (listAllParams: ListFunctionParams, listAllQuery: ListFunctionQuery) => {
			const queryAll = async (
				listParams: ListFunctionParams,
				listQuery: ListFunctionQuery
			): Promise<QueryAllOutput<ListQueryReturn>> => {
				const { Items, ...PageData } = await listFunction(listParams, listQuery);

				if (PageData.LastEvaluatedKey) {
					const moreData = await queryAll(listParams, { ...listQuery, ExclusiveStartKey: PageData.LastEvaluatedKey });

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

			return queryAll(listAllParams, listAllQuery);
		}
	};
};
