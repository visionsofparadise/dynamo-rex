import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Table } from './Table';

export const Dx = {
	Table: class TableKeySpace<
		BaseAttributes extends Record<string, any> = Record<string, any>
	> extends Table<BaseAttributes> {
		constructor(public client: DynamoDBDocumentClient) {
			super(client, {} as any);
		}
	}
};
