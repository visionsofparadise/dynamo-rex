import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { GetItemOutput } from './get';
import { QueryOutput } from './query';
import { NotPIdxN, TIdxN, IdxCfgM } from './Table';

export const hasItem: <
	A extends DocumentClient.AttributeMap,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
>(
	data: DocumentClient.GetItemOutput
) => asserts data is GetItemOutput<A, ISIdxN, TPIdxN, TIdxCfgM> = data => {
	if (!data || !data.Item || typeof data.Item !== 'object' || Object.keys(data.Item).length === 0) {
		throw new Error('Item not found');
	}
};

export const hasItems: <
	A extends DocumentClient.AttributeMap,
	IdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	ISIdxN extends NotPIdxN<TPIdxN, TIdxCfgM>,
	TPIdxN extends TIdxN<TIdxCfgM>,
	TIdxCfgM extends IdxCfgM<TPIdxN>
>(
	data: DocumentClient.QueryOutput | DocumentClient.ScanOutput
) => asserts data is QueryOutput<A, IdxN, ISIdxN, TPIdxN, TIdxCfgM> = data => {
	if (!data || !data.Items || typeof data.Items !== 'object') {
		throw new Error('Items not found');
	}
};
