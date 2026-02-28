export interface DomainEvent<TPayload = unknown> {
    readonly eventId: string;
    readonly eventName: string;
    readonly occurredAt: Date;
    readonly aggregateId: string;
    readonly aggregateType: string;
    readonly correlationId: string;
    readonly payload: TPayload;
}
