import _chunk from 'lodash/chunk';
import _pick from 'lodash/pick';
import { _delete } from './delete';
import { scan } from './scan';
import { IdxALiteral } from '../../Index/Index';
import { IdxCfgProps, Table } from '../Table';

export const reset =
	<
		TIdxN extends PropertyKey,
		TPIdxN extends TIdxN,
		TIdxA extends PropertyKey,
		TIdxAL extends IdxALiteral,
		IdxCfg extends IdxCfgProps<TIdxN, TIdxA, TIdxAL>
	>(
		Table: Table<TIdxN, TPIdxN, TIdxA, TIdxAL, IdxCfg>
	) =>
	async () => {
		const scanData = await scan(Table)();

		if (scanData.Items) {
			const batches = _chunk(scanData.Items);

			for (const batch of batches) {
				await Promise.all(
					batch.map(async Item =>
						_delete(Table)({
							Key: _pick(Item, [
								Table.indexConfig[Table.tableConfig.primaryIndex].hashKey,
								Table.indexConfig[Table.tableConfig.primaryIndex].rangeKey
							]) as any
						})
					)
				);
			}
		}

		return;
	};
