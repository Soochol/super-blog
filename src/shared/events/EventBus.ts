import { DomainEvent } from './DomainEvent';
import { DomainEventMap, DomainEventName } from './DomainEvents';

export type EventHandler<TPayload = unknown> = (event: DomainEvent<TPayload>) => void | Promise<void>;

export type Unsubscribe = () => void;

export interface EventBus {
    publish<K extends DomainEventName>(event: DomainEvent<DomainEventMap[K]>): void;
    subscribe<K extends DomainEventName>(eventName: K, handler: EventHandler<DomainEventMap[K]>): Unsubscribe;
    shutdown(): Promise<void>;
}
