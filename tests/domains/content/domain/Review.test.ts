import { validateReviewLength } from '../../../../src/domains/content/domain/Review';

describe('Review Domain Logic', () => {
    it('should validate review length to be under 500 characters', () => {
        expect(validateReviewLength('Short review')).toBe(true);
        expect(validateReviewLength('a'.repeat(501))).toBe(false);
    });
});
