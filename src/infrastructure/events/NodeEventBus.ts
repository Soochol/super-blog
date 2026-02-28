import { EventEmitter } from 'events';
import { DomainEvent } from '../../shared/events/DomainEvent';
import { EventBus, EventHandler, Unsubscribe } from '../../shared/events/EventBus';
import { DomainEventMap, DomainEventName } from '../../shared/events/DomainEvents';

const DEFAULT_MAX_LISTENERS = 20;

export interface EventErrorContext {
    eventName: string;
    eventId: string;
    correlationId: string;
}

export type EventErrorHandler = (error: unknown, context: EventErrorContext) => void;

export interface NodeEventBusOptions {
    maxListeners?: number;
    onError?: EventErrorHandler;
}

export class NodeEventBus implements EventBus {
    private emitter: EventEmitter;
    private onError: EventErrorHandler;
    private pendingHandlers = new Set<Promise<void>>();
    private isShuttingDown = false;

    constructor(options: NodeEventBusOptions = {}) {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(options.maxListeners ?? DEFAULT_MAX_LISTENERS);
        this.onError = options.onError ?? NodeEventBus.defaultErrorHandler;
    }

    private static defaultErrorHandler(error: unknown, context: EventErrorContext): void {
        console.error(
            `[NodeEventBus] Error in handler for "${context.eventName}" (eventId=${context.eventId}, correlationId=${context.correlationId}):`,
            error,
        );
    }

    private buildErrorContext(event: DomainEvent): EventErrorContext {
        return {
            eventName: event.eventName,
            eventId: event.eventId,
            correlationId: event.correlationId,
        };
    }

    private safeOnError(error: unknown, context: EventErrorContext): void {
        try {
            this.onError(error, context);
        } catch (onErrorError) {
            console.error('[NodeEventBus] onError handler itself threw:', onErrorError);
        }
    }

    publish<K extends DomainEventName>(event: DomainEvent<DomainEventMap[K]>): void {
        if (this.isShuttingDown) return;
        this.emitter.emit(event.eventName, event);
    }

    subscribe<K extends DomainEventName>(
        eventName: K,
        handler: EventHandler<DomainEventMap[K]>,
    ): Unsubscribe {
        if (this.isShuttingDown) return () => {};

        const wrapper = (event: DomainEvent<DomainEventMap[K]>) => {
            try {
                const result = handler(event);

                if (result && typeof (result as Promise<void>).then === 'function') {
                    const promise = (result as Promise<void>).catch((error) => {
                        this.safeOnError(error, this.buildErrorContext(event));
                    });
                    this.pendingHandlers.add(promise);
                    promise.finally(() => this.pendingHandlers.delete(promise));
                }
            } catch (error) {
                this.safeOnError(error, this.buildErrorContext(event));
            }
        };

        this.emitter.on(eventName, wrapper);
        return () => { this.emitter.off(eventName, wrapper); };
    }

    async shutdown(): Promise<void> {
        this.isShuttingDown = true;
        await Promise.allSettled([...this.pendingHandlers]);
        this.emitter.removeAllListeners();
    }
}
