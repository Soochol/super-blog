import { randomUUID } from 'crypto';
import { DomainEvent } from './DomainEvent';
import { ProductSpecs } from '../../domains/product/domain/ProductSpecs';

export interface ProductCrawledPayload {
    url: string;
    htmlHash: string;
    specs: ProductSpecs;
}

export interface ReviewGeneratedPayload {
    productId: string;
    reviewSummary: string;
}

export interface CategoryAssignedPayload {
    productId: string;
    categoryIds: string[];
}

export interface AffiliateLinkGeneratedPayload {
    productId: string;
    provider: string;
    affiliateUrl: string;
}

export interface DomainEventMap {
    ProductCrawled: ProductCrawledPayload;
    ReviewGenerated: ReviewGeneratedPayload;
    CategoryAssigned: CategoryAssignedPayload;
    AffiliateLinkGenerated: AffiliateLinkGeneratedPayload;
}

export type DomainEventName = keyof DomainEventMap;

export function createDomainEvent<K extends DomainEventName>(params: {
    eventName: K;
    aggregateId: string;
    aggregateType: string;
    payload: DomainEventMap[K];
    correlationId?: string;
}): DomainEvent<DomainEventMap[K]> {
    const eventId = randomUUID();
    return {
        eventId,
        eventName: params.eventName,
        occurredAt: new Date(),
        aggregateId: params.aggregateId,
        aggregateType: params.aggregateType,
        correlationId: params.correlationId ?? eventId,
        payload: params.payload,
    };
}
