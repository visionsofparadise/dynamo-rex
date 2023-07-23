import { DxMiddlewareHandler } from '../Middleware';
import { GenericAttributes } from '../Dx';
import { DxCommandGenericData } from '../command/Command';

export const dxSetAttributeOnWriteMiddleware = <Attributes extends GenericAttributes = GenericAttributes>(
	key: string & keyof Attributes,
	setter: () => number
): Array<DxMiddlewareHandler> => {
	const batchWriteHandler: DxMiddlewareHandler<
		'BatchWriteCommandInput',
		DxCommandGenericData & { Attributes: Attributes }
	> = {
		hook: 'BatchWriteCommandInput',
		handler: ({ data: batchWriteCommandInput }) => {
			return {
				...batchWriteCommandInput,
				requestItems: Object.fromEntries(
					Object.entries(batchWriteCommandInput.requestItems).map(([tableName, requests]) => [
						tableName,
						requests.map(request => {
							if ('put' in request) {
								return {
									put: {
										...request.put,
										[key]: setter()
									}
								};
							}

							return request;
						})
					])
				)
			};
		}
	};

	const putHandler: DxMiddlewareHandler<'PutCommandInput', DxCommandGenericData & { Attributes: Attributes }> = {
		hook: 'PutCommandInput',
		handler: ({ data: putCommandInput }) => {
			return {
				...putCommandInput,
				item: {
					...putCommandInput.item,
					[key]: setter()
				}
			};
		}
	};

	const transactWriteHandler: DxMiddlewareHandler<
		'TransactWriteCommandInput',
		DxCommandGenericData & { Attributes: Attributes }
	> = {
		hook: 'TransactWriteCommandInput',
		handler: ({ data: transactWriteCommandInput }) => {
			return {
				...transactWriteCommandInput,
				transactItems: Object.fromEntries(
					Object.entries(transactWriteCommandInput.transactItems).map(([tableName, transaction]) => {
						if (transaction.type === 'put') {
							return [
								tableName,
								{
									...transaction,
									item: {
										...transaction.item,
										[key]: setter()
									}
								}
							];
						}

						if (transaction.type === 'update') {
							return [
								tableName,
								{
									...transaction,
									updateExpression: transaction.updateExpression + `, ${key} = :${key}`,
									expressionAttributeValues: {
										...transaction.expressionAttributeValues,
										[`:${key}`]: setter()
									}
								}
							];
						}

						return [tableName, transaction];
					})
				)
			};
		}
	};

	const updateHandler: DxMiddlewareHandler<'UpdateCommandInput', DxCommandGenericData & { Attributes: Attributes }> = {
		hook: 'UpdateCommandInput',
		handler: ({ data: updateCommandInput }) => {
			if (!updateCommandInput.updateExpression!.startsWith('SET')) return;

			return {
				...updateCommandInput,
				updateExpression: updateCommandInput.updateExpression + `, ${key} = :${key}`,
				expressionAttributeValues: {
					...updateCommandInput.expressionAttributeValues,
					[`:${key}`]: setter()
				}
			};
		}
	};

	return [batchWriteHandler, putHandler, transactWriteHandler, updateHandler] as any;
};
