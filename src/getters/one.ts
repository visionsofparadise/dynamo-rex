import { GetItemOutput } from '../Table/get';
import { hasItem } from '../Table/hasItem';
import { IdxAFns } from '../Item/Item';
import { Table, IdxATL, IdxCfgM, IdxP, NotPIdxN, TIdxN } from '../Table/Table';
import { HKRKP } from './getters';
import { keyOfFn } from './keyOf';
import { QueryA, QueryOutput } from '../Table/query';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetterCfg } from './indexGetters';

type QueryOutputOne<A extends DocumentClient.AttributeMap> = Omit<QueryOutput<A>, 'Items'> & { Item: A };

export const oneFn =
	<
		IdxN extends ISIdxN | TPIdxN,
		IA extends {},
		ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
		IIdxAFns extends IdxAFns<IdxN, TIdxCfgM>,
		TPIdxN extends TIdxN<TIdxCfgM>,
		TIdxPA extends string,
		TIdxP extends IdxP<TIdxPA>,
		TIdxCfgM extends IdxCfgM<TPIdxN, string, IdxATL, TIdxPA, TIdxP>
	>(
		Table: Table<TPIdxN, string, IdxATL, TIdxPA, TIdxP, TIdxCfgM>,
		Item: IIdxAFns,
		config: GetterCfg<IdxN, TPIdxN, TIdxCfgM>
	) =>
	async (
		props: HKRKP<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>
	): Promise<
		IdxN extends TPIdxN
			? GetItemOutput<IA>
			: QueryOutputOne<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>>
	> => {
		const { hashKey, rangeKey, IndexName } = config;

		const keyOf = keyOfFn<IdxN, IIdxAFns, TPIdxN, TIdxCfgM>(Item, config);
		const Key = keyOf(props);

		const output = !IndexName
			? await Table.get<IA>({ Key })
			: await Table.query<IA, Exclude<IdxN, TPIdxN>>({
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

					hasItem<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>>(response);

					return response;
			  });

		const assertOutputIsConditional: (
			output: GetItemOutput<IA> | QueryOutputOne<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>>
		) => asserts output is IdxN extends TPIdxN
			? GetItemOutput<IA>
			: QueryOutputOne<QueryA<IA, TPIdxN, Exclude<IdxN, TPIdxN>, TIdxPA, TIdxP, TIdxCfgM>> = output => {
			if (!output.Item) {
				throw new Error('Failed to create output');
			}
		};

		assertOutputIsConditional(output);

		return output;
	};
