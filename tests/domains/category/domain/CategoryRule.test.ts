import { isEligibleForCategory } from '../../../../src/domains/category/domain/CategoryRule';

describe('CategoryRule Domain Logic', () => {
    it('should correctly filter products for ultra-light category', () => {
        const rule = {
            categoryId: 'ultra-light',
            name: 'Ultra Light Laptop',
            maxWeight: 1.2,
        };
        expect(isEligibleForCategory(rule, { weight: 0.98 } as any)).toBe(true);
        expect(isEligibleForCategory(rule, { weight: 1.5 } as any)).toBe(false);
    });
});
