import { NodeEventBus } from '@/infrastructure/events/NodeEventBus';
import { DomainEvent } from '@/shared/events/DomainEvent';

describe('NodeEventBus Adapter', () => {
    let eventBus: NodeEventBus;

    beforeEach(() => {
        eventBus = new NodeEventBus();
    });

    it('should publish an event and trigger registered subscribers', () => {
        const mockSubscriber = jest.fn();
        eventBus.subscribe('ProductCrawledEvent', mockSubscriber);

        const testEvent: DomainEvent = {
            eventName: 'ProductCrawledEvent',
            occurredAt: new Date(),
        };

        eventBus.publish(testEvent);

        expect(mockSubscriber).toHaveBeenCalledTimes(1);
        expect(mockSubscriber).toHaveBeenCalledWith(testEvent);
    });

    it('should not trigger subscribers of other events', () => {
        const mockSubscriber = jest.fn();
        eventBus.subscribe('OtherEvent', mockSubscriber);

        eventBus.publish({
            eventName: 'ProductCrawledEvent',
            occurredAt: new Date(),
        });

        expect(mockSubscriber).not.toHaveBeenCalled();
    });
});
