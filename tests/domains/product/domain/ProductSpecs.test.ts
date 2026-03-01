import { isGamingLaptop, ProductSpecs } from '../../../../src/domains/product/domain/ProductSpecs';

describe('ProductSpecs Domain Logic', () => {
    it('should identify a gaming laptop based on gpu', () => {
        expect(isGamingLaptop({ gpu: 'RTX 4060' } as ProductSpecs)).toBe(true);
        expect(isGamingLaptop({ gpu: 'Intel Iris Xe' } as ProductSpecs)).toBe(false);
    });
});
