import { DxMiddleware, DxMiddlewareHook } from './middleware';
import { GenericAttributes } from '../Dx';

export const dxSetAttributeOnWriteMiddleware = <Attributes extends GenericAttributes = GenericAttributes>(
	key: string & keyof Attributes,
	setter: () => number
): Array<DxMiddleware<DxMiddlewareHook, Attributes>> => [
	{
		hook: 'BatchWriteCommandInput',
		handler: ({ data: batchWriteCommandInput }) => {
			if (!batchWriteCommandInput.RequestItems) return;

			return {
				...batchWriteCommandInput,
				RequestItems: Object.fromEntries(
					Object.entries(batchWriteCommandInput.RequestItems).map(([tableName, requests]) => [
						tableName,
						requests.map(request => {
							if (request.PutRequest) {
								return {
									PutRequest: {
										...request.PutRequest,
										Item: {
											...request.PutRequest.Item,
											[key]: setter()
										}
									}
								};
							}

							return request;
						})
					])
				)
			};
		}
	},
	{
		hook: 'PutCommandInput',
		handler: ({ data: putCommandInput }) => {
			if (!putCommandInput.Item) return;

			return {
				...putCommandInput,
				Item: {
					...putCommandInput.Item,
					[key]: setter()
				}
			};
		}
	},
	{
		hook: 'TransactWriteCommandInput',
		handler: ({ data: transactWriteCommandInput }) => {
			if (!transactWriteCommandInput.TransactItems) return;

			return {
				...transactWriteCommandInput,
				TransactItems: Object.fromEntries(
					Object.entries(transactWriteCommandInput.TransactItems).map(([tableName, transaction]) => [
						tableName,
						{
							...transaction,
							Put: transaction.Put
								? {
										...transaction.Put,
										Item: {
											...transaction.Put.Item,
											[key]: setter()
										}
								  }
								: undefined,
							Update: transaction.Update
								? {
										...transaction.Update,
										UpdateExpression: transaction.Update.UpdateExpression + `, ${key} = :${key}`,
										ExpressionAttributeValues: {
											...transaction.Update.ExpressionAttributeValues,
											[`:${key}`]: setter()
										}
								  }
								: undefined
						}
					])
				)
			};
		}
	} as DxMiddleware<'TransactWriteCommandInput', Attributes>,
	{
		hook: 'UpdateCommandInput',
		handler: ({ data: updateCommandInput }) => {
			if (!updateCommandInput.UpdateExpression!.startsWith('SET')) return;

			return {
				...updateCommandInput,
				UpdateExpression: updateCommandInput.UpdateExpression + `, ${key} = :${key}`,
				ExpressionAttributeValues: {
					...updateCommandInput.ExpressionAttributeValues,
					[`:${key}`]: setter()
				}
			};
		}
	}
];
