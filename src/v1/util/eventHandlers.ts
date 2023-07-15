import { ConsumedCapacity, ItemCollectionMetrics } from '@aws-sdk/client-dynamodb';

export interface EventHandlers {
	onConsumedCapacity?: (consumedCapacity: ConsumedCapacity) => any | Promise<any>;
	onItemCollectionMetrics?: (itemCollectionMetrics: ItemCollectionMetrics) => any | Promise<any>;
}

export const triggerEventHandlers = async (
	events: {
		ConsumedCapacity?: ConsumedCapacity;
		ItemCollectionMetrics?: ItemCollectionMetrics;
	},
	eventHandlerSets: Array<EventHandlers | undefined>
) => {
	for (const eventHandlers of eventHandlerSets) {
		if (eventHandlers) {
			if (events.ConsumedCapacity && eventHandlers.onConsumedCapacity) {
				await eventHandlers.onConsumedCapacity(events.ConsumedCapacity);
			}

			if (events.ItemCollectionMetrics && eventHandlers.onItemCollectionMetrics) {
				await eventHandlers.onItemCollectionMetrics(events.ItemCollectionMetrics);
			}
		}
	}
};
