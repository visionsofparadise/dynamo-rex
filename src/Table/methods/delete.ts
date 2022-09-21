import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';
import { get, GetItemInput } from './get';

export type DeleteItemInput<
	A extends DocumentClient.AttributeMap,
	PK extends DocumentClient.GetItemInput['Key'],
	RV extends DocumentClient.ReturnValue
> = Omit<DocumentClient.DeleteItemInput, 'TableName' | 'Key' | 'ReturnValues'> & {
	Key: GetItemInput<A, PK>['Key'];
	ReturnValues?: RV;
};

export type DeleteItemOutput<A extends DocumentClient.AttributeMap, RV extends DocumentClient.ReturnValue> = Omit<
	DocumentClient.DeleteItemOutput,
	'Attributes'
> & {
	Attributes: RV extends 'NONE' | undefined | never ? undefined : RV extends 'ALL_OLD' ? A : undefined;
};

export const _delete =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async <A extends DocumentClient.AttributeMap, RV extends DocumentClient.ReturnValue>(
		query: DeleteItemInput<A, IdxCfg[TPIdxN]['key'], RV>
	): Promise<DeleteItemOutput<A, RV>> => {
		await get(Table)(query);

		const data = await Table.tableConfig.client.delete({ TableName: Table.tableConfig.name, ...query }).promise();

		return {
			...data,
			Attributes: data.Attributes as RV extends 'NONE' | undefined | never
				? undefined
				: RV extends 'ALL_OLD'
				? A
				: undefined
		};
	};
