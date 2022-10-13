import { GetItemOutput } from '../Table/get';
import { hasItem } from '../Table/hasItem';
import { IdxAFns } from '../Item/Item';
import { Table, IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { keyOfFn } from './keyOf';
import { QueryOutput } from '../Table/query';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetterCfg, QueryIdxN } from './indexGetters';

type QueryOutputOne<
	A extends DocumentClient.AttributeMap,
	IdxN extends ISIdxN,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
> = Omit<QueryOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>, 'Items'> & {
	Item: QueryOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM>['Items'][number];
};

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
			? GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>
			: QueryOutputOne<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>
	> => {
		const { hashKey, rangeKey, IndexName } = config;

		const keyOf = keyOfFn<IdxN, ISIdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);
		const Key = keyOf(props);

		const output = !IndexName
			? await Table.get<IA, ISIdxN>({ Key })
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
					const response = {
						Item: data.Items[0],
						ConsumedCapacity: data.ConsumedCapacity
					};

					hasItem<IA, ISIdxN, TPIdxN, TIdxCfgM>(response);

					return response;
			  });

		const assertOutputIsConditional: (
			output:
				| GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>
				| QueryOutputOne<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM>
		) => asserts output is IdxN extends TPIdxN
			? GetItemOutput<IA, ISIdxN, TPIdxN, TIdxCfgM>
			: QueryOutputOne<IA, QueryIdxN<IdxN, ISIdxN, TPIdxN, TIdxCfgM>, ISIdxN, TPIdxN, TIdxCfgM> = output => {
			if (!output.Item) {
				throw new Error('Failed to create output');
			}
		};

		assertOutputIsConditional(output);

		return output;
	};