import omit from 'lodash/omit';
import { IdxATL, IdxCfgSet } from '../Table/Table';
import { OptionalAttributes } from '../utils';
import { QueryInput, QueryOutput } from '../Table/query';
import { StaticItem } from '../Item/Item';

export const getAllFn =
	<
		ISIdx extends string & Exclude<keyof TIdxCfg, TPIdxN>,
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>,
		Item extends StaticItem<ISIdx, TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	>() =>
	<
		ListFunctionQuery extends OptionalAttributes<
			QueryInput<TPIdxN, ISIdx, TIdxCfg>,
			'KeyConditionExpression' | 'ExpressionAttributeValues'
		>
	>(
		listFunction: (listQuery: ListFunctionQuery) => Promise<QueryOutput<InstanceType<Item>>>
	) =>
	async (
		listQuery: ListFunctionQuery
	): Promise<
		Pick<QueryOutput<InstanceType<Item>>, 'Items'> & { PageData: Array<Omit<QueryOutput<InstanceType<Item>>, 'Items'>> }
	> => {
		const getPages = async (
			internalListQuery: ListFunctionQuery
		): Promise<
			Pick<QueryOutput<InstanceType<Item>>, 'Items'> & {
				PageData: Array<Omit<QueryOutput<InstanceType<Item>>, 'Items'>>;
			}
		> => {
			const data = await listFunction(internalListQuery);

			if (data.LastEvaluatedKey) {
				const moreData = await getPages({ ...internalListQuery, ExclusiveStartKey: data.LastEvaluatedKey });

				return {
					Items: [...data.Items, ...moreData.Items],
					PageData: [omit(data, 'Items'), ...moreData.PageData]
				};
			} else {
				return {
					Items: data.Items,
					PageData: [omit(data, 'Items')]
				};
			}
		};

		return getPages(listQuery);
	};
