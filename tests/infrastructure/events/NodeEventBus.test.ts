import { EventEmitter } from 'events';
import { NodeEventBus, EventErrorContext } from '@/infrastructure/events/NodeEventBus';
import { DomainEvent } from '@/shared/events/DomainEvent';
import { createDomainEvent } from '@/shared/events/DomainEvents';

function makeProductCrawledEvent(overrides: { correlationId?: string } = {}) {
    return createDomainEvent({
        eventName: 'ProductCrawled',
        aggregateId: 'product-123',
        aggregateType: 'Product',
        payload: {
            url: 'https://example.com',
            htmlHash: 'abc123',
            specs: {
                maker: 'Apple', model: 'MacBook Pro', cpu: 'M3',
                ram: 16, storage: '512GB', gpu: 'M3 GPU',
                display_size: 14.2, weight: 1.55, os: 'macOS', price: 2399000,
            },
        },
        ...overrides,
    });
}

function makeReviewGeneratedEvent(correlationId?: string) {
    return createDomainEvent({
        eventName: 'ReviewGenerated',
        aggregateId: 'review-456',
        aggregateType: 'Review',
        payload: { productId: 'product-123', reviewSummary: 'Great laptop' },
        correlationId,
    });
}

describe('NodeEventBus', () => {
    let eventBus: NodeEventBus;

    beforeEach(() => {
        eventBus = new NodeEventBus();
    });

    afterEach(async () => {
        await eventBus.shutdown();
    });

    // 1. Basic publish/subscribe
    it('should publish an event and trigger registered subscribers', () => {
        const handler = jest.fn();
        eventBus.subscribe('ProductCrawled', handler);

        const event = makeProductCrawledEvent();
        eventBus.publish(event);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(event);
    });

    // 2. Event isolation
    it('should not trigger subscribers of other events', () => {
        const handler = jest.fn();
        eventBus.subscribe('ReviewGenerated', handler);

        eventBus.publish(makeProductCrawledEvent());

        expect(handler).not.toHaveBeenCalled();
    });

    // 3. Multiple subscribers for same event
    it('should deliver event to all subscribers of the same event', () => {
        const handlerA = jest.fn();
        const handlerB = jest.fn();
        eventBus.subscribe('ProductCrawled', handlerA);
        eventBus.subscribe('ProductCrawled', handlerB);

        const event = makeProductCrawledEvent();
        eventBus.publish(event);

        expect(handlerA).toHaveBeenCalledWith(event);
        expect(handlerB).toHaveBeenCalledWith(event);
    });

    // 4. Async handler completion
    it('should handle async handlers correctly', async () => {
        let resolved = false;
        eventBus.subscribe('ProductCrawled', async () => {
            await new Promise((r) => setTimeout(r, 10));
            resolved = true;
        });

        eventBus.publish(makeProductCrawledEvent());
        await eventBus.shutdown();

        expect(resolved).toBe(true);
    });

    // 5. Async handler error caught
    it('should catch async handler errors and call onError', async () => {
        const onError = jest.fn();
        eventBus = new NodeEventBus({ onError });

        eventBus.subscribe('ProductCrawled', async () => {
            throw new Error('async failure');
        });

        eventBus.publish(makeProductCrawledEvent());
        await eventBus.shutdown();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect((onError.mock.calls[0][0] as Error).message).toBe('async failure');
    });

    // 6. Sync handler error caught
    it('should catch sync handler errors and call onError', async () => {
        const onError = jest.fn();
        eventBus = new NodeEventBus({ onError });

        eventBus.subscribe('ProductCrawled', () => {
            throw new Error('sync failure');
        });

        eventBus.publish(makeProductCrawledEvent());
        await eventBus.shutdown();

        expect(onError).toHaveBeenCalledTimes(1);
        expect((onError.mock.calls[0][0] as Error).message).toBe('sync failure');
    });

    // 7. Custom error handler receives EventErrorContext
    it('should pass structured EventErrorContext to onError', async () => {
        const onError = jest.fn();
        eventBus = new NodeEventBus({ onError });

        eventBus.subscribe('ProductCrawled', () => { throw new Error('fail'); });

        const event = makeProductCrawledEvent({ correlationId: 'corr-abc' });
        eventBus.publish(event);
        await eventBus.shutdown();

        const context: EventErrorContext = onError.mock.calls[0][1];
        expect(context.eventName).toBe('ProductCrawled');
        expect(context.eventId).toBe(event.eventId);
        expect(context.correlationId).toBe('corr-abc');
    });

    // 8. Unsubscribe prevents handler from being called
    it('should not call handler after unsubscribe', () => {
        const handler = jest.fn();
        const unsubscribe = eventBus.subscribe('ProductCrawled', handler);

        unsubscribe();
        eventBus.publish(makeProductCrawledEvent());

        expect(handler).not.toHaveBeenCalled();
    });

    // 9. Unsubscribe only affects the specific handler
    it('should only unsubscribe the specific handler', () => {
        const handlerA = jest.fn();
        const handlerB = jest.fn();
        const unsubA = eventBus.subscribe('ProductCrawled', handlerA);
        eventBus.subscribe('ProductCrawled', handlerB);

        unsubA();
        eventBus.publish(makeProductCrawledEvent());

        expect(handlerA).not.toHaveBeenCalled();
        expect(handlerB).toHaveBeenCalledTimes(1);
    });

    // 10. Correlation ID propagation
    it('should allow correlation ID propagation through event chains', () => {
        const publishedEvents: DomainEvent<unknown>[] = [];

        eventBus.subscribe('ProductCrawled', (event) => {
            const followUp = makeReviewGeneratedEvent(event.correlationId);
            publishedEvents.push(followUp);
            eventBus.publish(followUp);
        });

        const original = makeProductCrawledEvent({ correlationId: 'trace-123' });
        eventBus.publish(original);

        expect(publishedEvents[0].correlationId).toBe('trace-123');
    });

    // 11. Default correlationId auto-generation (reuses eventId)
    it('should use eventId as default correlationId when not provided', () => {
        const event = makeProductCrawledEvent();

        expect(event.correlationId).toBe(event.eventId);
    });

    // 12. eventId uniqueness
    it('should generate unique eventId for each event', () => {
        const eventA = makeProductCrawledEvent();
        const eventB = makeProductCrawledEvent();

        expect(eventA.eventId).not.toBe(eventB.eventId);
    });

    // 13. Shutdown drains pending async handlers
    it('should drain pending async handlers on shutdown', async () => {
        let completed = false;
        eventBus.subscribe('ProductCrawled', async () => {
            await new Promise((r) => setTimeout(r, 50));
            completed = true;
        });

        eventBus.publish(makeProductCrawledEvent());
        // shutdown should wait for the handler to finish
        await eventBus.shutdown();

        expect(completed).toBe(true);
    });

    // 14. Publish after shutdown is ignored
    it('should ignore publish calls after shutdown', async () => {
        const handler = jest.fn();
        eventBus.subscribe('ProductCrawled', handler);

        await eventBus.shutdown();
        eventBus.publish(makeProductCrawledEvent());

        expect(handler).not.toHaveBeenCalled();
    });

    // 15. maxListeners option
    it('should respect maxListeners option', () => {
        const spy = jest.spyOn(EventEmitter.prototype, 'setMaxListeners');

        new NodeEventBus({ maxListeners: 42 });
        expect(spy).toHaveBeenCalledWith(42);

        new NodeEventBus();
        expect(spy).toHaveBeenCalledWith(20); // default

        spy.mockRestore();
    });
});
