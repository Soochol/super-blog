import { EventBus } from '../../shared/events/EventBus';
import { NodeEventBus } from './NodeEventBus';

const globalForEventBus = globalThis as unknown as { eventBus: EventBus };

export const eventBus: EventBus =
    globalForEventBus.eventBus ??
    (globalForEventBus.eventBus = new NodeEventBus());
