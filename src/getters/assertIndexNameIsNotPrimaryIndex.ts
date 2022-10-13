export const assertIndexNameIsNotPrimaryIndex: <IdxN extends string, TPIdxN extends string>(
	IndexName: IdxN | undefined,
	index: string | undefined,
	primaryIndex: string
) => asserts IndexName is Exclude<IdxN, TPIdxN> = (IndexName, index, primaryIndex) => {
	if (index === primaryIndex && IndexName) {
		throw new Error('Incorrectly set IndexName');
	}

	if (index !== primaryIndex && !IndexName) {
		throw new Error('Incorrectly set IndexName');
	}
};
