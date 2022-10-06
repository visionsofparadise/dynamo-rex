import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { Assign, NoTableName } from '../utils';
import { Table, IdxATL, IdxCfgSet, IdxKey } from './Table';

export type ScanInput<
	TPIdxN extends string & keyof TIdxCfg,
	SIdx extends Exclude<keyof TIdxCfg, TPIdxN> | never,
	TIdxCfg extends IdxCfgSet<string, IdxATL>
> = Assign<
	NoTableName<DocumentClient.ScanInput>,
	{
		IndexName?: SIdx;
		ExclusiveStartKey?: IdxKey<TIdxCfg[TPIdxN]> & SIdx extends Exclude<keyof TIdxCfg, TPIdxN>
			? IdxKey<TIdxCfg[SIdx]>
			: {};
	}
>;

export type ScanOutput<A extends DocumentClient.AttributeMap> = Assign<
	DocumentClient.ScanOutput,
	{
		Items?: Array<A>;
	}
>;

export const scanFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>(
		ParentTable: Table<TIdxA, TIdxATL, TPIdxN, TIdxCfg>
	) =>
	async <A extends IdxKey<TIdxCfg[TPIdxN]>, SIdx extends (string & Exclude<keyof TIdxCfg, TPIdxN>) | never>(
		query?: ScanInput<TPIdxN, SIdx, TIdxCfg>
	): Promise<ScanOutput<A>> => {
		const fallbackQuery = query || {};

		const data = await ParentTable.config.client
			.scan({ TableName: ParentTable.config.name, ...fallbackQuery })
			.promise();

		if (ParentTable.config.logger) ParentTable.config.logger.info(data);

		ParentTable.hasItems<A>(data);

		return data;
	};
