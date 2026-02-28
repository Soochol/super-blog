import { EventEmitter } from 'events';
import { DomainEvent } from '../../shared/events/DomainEvent';

export class NodeEventBus {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

    publish(event: DomainEvent): void {
        this.emitter.emit(event.eventName, event);
    }

    subscribe(eventName: string, handler: (event: DomainEvent) => void | Promise<void>): void {
        this.emitter.on(eventName, handler);
    }
}
