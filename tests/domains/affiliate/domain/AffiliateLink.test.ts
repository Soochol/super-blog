import { createAffiliateLink } from '../../../../src/domains/affiliate/domain/AffiliateLink';

describe('AffiliateLink Domain Logic', () => {
    it('should append affiliate pattern for Coupang', () => {
        const url = createAffiliateLink('COUPANG', 'AFF123', 'https://coupang.com/p/1');
        expect(url).toContain('AFF123');
        expect(url).toContain('link.coupang.com');
    });
});
