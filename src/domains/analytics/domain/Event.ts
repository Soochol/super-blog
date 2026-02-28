export interface TrackingEvent {
    eventName: string;
    payload: Record<string, any>;
    timestamp: Date;
}

export function createCtaClickEvent(
    productId: string,
    pageType: 'product_detail' | 'comparison' | 'category',
    ctaPosition: 'top' | 'middle' | 'bottom',
    ctaVariant: string
): TrackingEvent {
    return {
        eventName: 'cta_click',
        payload: { product_id: productId, page_type: pageType, cta_position: ctaPosition, cta_variant: ctaVariant },
        timestamp: new Date()
    };
}
