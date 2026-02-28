import { createCtaClickEvent } from '../../../../src/domains/analytics/domain/Event';

describe('Analytics Event Domain Logic', () => {
    it('should format a CTA click event correctly', () => {
        const event = createCtaClickEvent('prod-1', 'product_detail', 'top', 'A');
        expect(event.eventName).toBe('cta_click');
        expect(event.payload.product_id).toBe('prod-1');
    });
});
