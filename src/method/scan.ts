import { Table } from '../Table';
import { GenericAttributes } from '../Dx';
import { DxScanCommand, DxScanCommandInput, DxScanCommandOutput } from '../command/Scan';
import { DxListParams } from './query';

export interface DxScanInput<
	Index extends string | never = never,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DxScanCommandInput<CursorKey>, 'tableName' | 'index' | 'limit' | 'scanIndexForward'>,
		DxListParams<Index> {}

export type DxScanOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = DxScanCommandOutput<Attributes, CursorKey>;

export const dxTableScan = async <T extends Table = Table, Index extends T['SecondaryIndex'] | never = never>(
	Table: T,
	input?: DxScanInput<Index, Table.GetIndexCursorKey<T, Index & string>>
): Promise<DxScanOutput<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<T, Index & string>
	): Promise<DxScanOutput<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>> => {
		const { autoPage, pageLimit, totalLimit, ...inputRest } =
			input || ({} as DxScanInput<Index, Table.GetIndexCursorKey<T, Index & string>>);

		const output = await Table.dxClient.send(
			new DxScanCommand<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>({
				...inputRest,
				tableName: Table.tableName,
				cursorKey: pageCursorKey,
				limit: pageLimit
			})
		);

		const { items, cursorKey, count = 0, ...rest } = output;

		const newTotalCount = totalCount + items.length;

		if (!autoPage || !cursorKey || (totalLimit && newTotalCount >= totalLimit)) {
			return {
				items: items.slice(0, totalLimit),
				cursorKey,
				count,
				...rest
			};
		}

		const nextPage = await recurse(newTotalCount, cursorKey);

		return {
			items: [...items, ...nextPage.items].slice(0, totalLimit),
			cursorKey: nextPage.cursorKey,
			count: count + (nextPage.count || 0),
			...rest
		};
	};

	return recurse(0, input?.cursorKey);
};
