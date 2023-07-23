import { Table } from '../Table';
import { AnyKeySpace } from '../KeySpace';
import { GenericAttributes } from '../Dx';
import { DxQueryCommand, DxQueryCommandInput, DxQueryCommandOutput } from '../command/Query';

export interface DxListParams<Index extends string | never | undefined> {
	index?: Index;
	pageLimit?: number;
	totalLimit?: number;
	autoPage?: boolean;
}

export interface DxQueryInput<
	Index extends string | never | undefined = undefined,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DxQueryCommandInput<CursorKey>, 'tableName' | 'index' | 'limit'>,
		DxListParams<Index> {}

export type DxQueryOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = DxQueryCommandOutput<Attributes, CursorKey>;

export const dxTableQuery = async <
	T extends Table = Table,
	Index extends T['SecondaryIndex'] | never | undefined = never | undefined
>(
	Table: T,
	input: DxQueryInput<Index, Table.GetIndexCursorKey<T, Index & string>>
): Promise<DxQueryOutput<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<T, Index & string>
	): Promise<DxQueryOutput<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>> => {
		const { autoPage, pageLimit, totalLimit, ...inputRest } = input;

		const output = await Table.dxClient.send(
			new DxQueryCommand<T['AttributesAndIndexKeys'], Table.GetIndexCursorKey<T, Index & string>>({
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

export const dxQuery = async <
	K extends AnyKeySpace = AnyKeySpace,
	Index extends K['SecondaryIndex'] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: DxQueryInput<Index, Table.GetIndexCursorKey<K['Table'], Index>>
): Promise<DxQueryOutput<K['Attributes'], Table.GetIndexCursorKey<K['Table'], Index>>> => {
	const output = await dxTableQuery(KeySpace.Table, input);

	return {
		...output,
		items: output.items.map(item => KeySpace.omitIndexKeys(item))
	};
};
