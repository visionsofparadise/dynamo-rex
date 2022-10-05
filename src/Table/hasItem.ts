import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemOutput } from './get';
import { QueryOutput } from './query';
import { ScanOutput } from './scan';
import { IdxATL, IdxCfgSet, IdxKey } from './Table';

export const hasItemFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>() =>
	<A extends IdxKey<TIdxCfg[TPIdxN]>>(data: DocumentClient.GetItemOutput): asserts data is GetItemOutput<A> => {
		if (!data || !data.Item || typeof data.Item !== 'object' || Object.keys(data.Item).length === 0) {
			throw new Error('Item not found');
		}
	};

export const hasItemsFn =
	<
		TIdxA extends string,
		TIdxATL extends IdxATL,
		TPIdxN extends string & keyof TIdxCfg,
		TIdxCfg extends IdxCfgSet<TIdxA, TIdxATL>
	>() =>
	<A extends IdxKey<TIdxCfg[TPIdxN]>>(
		data: DocumentClient.QueryOutput | DocumentClient.ScanOutput
	): asserts data is QueryOutput<A> & ScanOutput<A> => {
		if (!data || !data.Items || typeof data.Items !== 'object') {
			throw new Error('Items not found');
		}
	};
