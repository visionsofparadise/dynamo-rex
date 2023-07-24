import { DxMiddlewareHandler } from '../Middleware';
import { GenericAttributes } from '../Dx';
import { DxCommandGenericData } from '../command/Command';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export const dxSetAttributeOnWriteMiddleware = <Attributes extends GenericAttributes = GenericAttributes>(
	key: string & keyof Attributes,
	setter: () => NativeAttributeValue
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
				transactItems: transactWriteCommandInput.transactItems.map(request => {
					if (request.type === 'put') {
						return {
							...request,
							item: {
								...request.item,
								[key]: setter()
							}
						};
					}

					if (request.type === 'update') {
						if (!request.updateExpression!.startsWith('SET')) return request;

						return {
							...request,
							updateExpression: request.updateExpression + `, ${key} = :${key}`,
							expressionAttributeValues: {
								...request.expressionAttributeValues,
								[`:${key}`]: setter()
							}
						};
					}

					return request;
				})
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
