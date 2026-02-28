import { isGamingLaptop } from '../../../../src/domains/product/domain/ProductSpecs';

describe('ProductSpecs Domain Logic', () => {
    it('should identify a gaming laptop based on gpu', () => {
        expect(isGamingLaptop({ gpu: 'RTX 4060' } as any)).toBe(true);
        expect(isGamingLaptop({ gpu: 'Intel Iris Xe' } as any)).toBe(false);
    });
});
