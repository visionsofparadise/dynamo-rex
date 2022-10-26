import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTN } from '../utils';
import { assertPutAttributes } from './assertAttributes2';
import { IdxKeys, MCfg, Cfg, CfgSIdxN, CfgPIdxKey } from './Table2';

export type PutReturnValues = 'NONE' | 'ALL_OLD' | undefined | never;

export type PutItemInput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends CfgSIdxN<TCfg> | never,
	TCfg extends Cfg
> = Assign<
	NoTN<DocumentClient.PutItemInput>,
	{
		Item: A & IdxKeys<ISIdxN, TCfg> & CfgPIdxKey<TCfg>;
		ReturnValues?: RV;
	}
>;

export type PutItemOutput<
	A extends DocumentClient.AttributeMap,
	RV extends PutReturnValues,
	ISIdxN extends CfgSIdxN<TCfg> | never,
	TCfg extends Cfg
> = Assign<
	DocumentClient.PutItemOutput,
	{
		Attributes: RV extends 'ALL_OLD' ? A & IdxKeys<ISIdxN, TCfg> & CfgPIdxKey<TCfg> : undefined;
	}
>;

export const putFn =
	<TCfg extends Cfg>(config: MCfg) =>
	async <A extends {}, RV extends PutReturnValues = never, ISIdxN extends CfgSIdxN<TCfg> = never>(
		query: PutItemInput<A, RV, ISIdxN, TCfg>
	): Promise<PutItemOutput<A, RV, ISIdxN, TCfg>> => {
		const data = await config.client.put({ TableName: config.name, ...query }).promise();

		if (config.logger) config.logger.info(data);

		assertPutAttributes<A, RV, ISIdxN, TCfg>(data, query.ReturnValues);

		return data;
	};
