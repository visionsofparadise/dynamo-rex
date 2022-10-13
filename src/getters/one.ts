import { GetItemOutput } from '../Table/get';
import { hasItems } from '../Table/hasItem';
import { IdxAFns } from '../Item/Item';
import { Table, IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { keyOfFn } from './keyOf';
import { QueryOutput } from '../Table/query';
import { GetterCfg, QueryIdxN } from './indexGetters';

export const oneFn =
	<
		IA extends {},
		IdxN extends TPIdxN | ISIdxN,
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<IdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns,
		config: GetterCfg<IdxN, ISIdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		props: HKRKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>
	): Promise<
		IdxN extends TPIdxN
			? GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>['Item']
			: QueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>['Items'][number]
	> => {
		const { hashKey, rangeKey, IndexName } = config;

		const keyOf = keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);
		const Key = keyOf(props);

		const output = !IndexName
			? await Table.get<IA, ISIdxN>({ Key }).then(data => data.Item)
			: await Table.query<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN>({
					IndexName,
					Limit: 1,
					KeyConditionExpression: `${hashKey} = :hashKey${rangeKey ? ` AND ${rangeKey} = :rangeKey` : ``}`,
					ExpressionAttributeValues: rangeKey
						? {
								[`:hashKey`]: Key[hashKey],
								[`:rangeKey`]: Key[rangeKey]
						  }
						: {
								[`:hashKey`]: Key[hashKey]
						  }
			  }).then(data => {
					hasItems<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>(data);

					return data.Items[0];
			  });

		const assertOutputIsConditional: (
			output:
				| GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>['Item']
				| QueryOutput<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>['Items'][number]
		) => asserts output is IdxN extends TPIdxN
			? GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>['Item']
			: QueryOutput<
					IA,
					QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>,
					ISIdxN,
					TPIdxN,
					TIdxCfgM
			  >['Items'][number] = output => {
			if (!output) {
				throw new Error('Failed to create output');
			}
		};

		assertOutputIsConditional(output);

		return output;
	};
