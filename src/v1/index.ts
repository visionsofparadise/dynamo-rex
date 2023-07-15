export {
	Table,
	GetTableIndex,
	PrimaryIndex,
	GetTableSecondaryIndex,
	GetTableIndexKey,
	GetTableIndexKeys,
	GetTableIndexKeyMap,
	GetTableIndexCursorKey
} from './Table';

export { dxGetItem as dxGet } from './command/getItem';
export { dxPutItem as dxPut } from './command/putItem';
