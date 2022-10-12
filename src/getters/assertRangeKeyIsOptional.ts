import { IdxACfg, IdxCfgM, TIdxN } from '../Table/Table';

export const assertRangeKeyIsOptional: <IdxN extends TIdxN<TIdxCfgM>, TIdxCfgM extends IdxCfgM>(
	rangeKey: string | undefined,
	index: IdxN,
	indexConfig: TIdxCfgM
) => asserts rangeKey is TIdxCfgM[IdxN]['rangeKey'] extends IdxACfg
	? TIdxCfgM[IdxN]['rangeKey']['attribute']
	: undefined = (rangeKey, index, indexConfig) => {
	if (indexConfig[index].rangeKey && !rangeKey) {
		throw new Error('Incorrectly set range key');
	}

	if (!indexConfig[index].rangeKey && rangeKey) {
		throw new Error('Incorrectly set range key');
	}
};
