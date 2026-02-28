import { generateComparisonMeta } from '../../../../src/domains/publishing/domain/SeoRoute';

describe('Publishing Domain Logic', () => {
    it('should generate accurate comparison title and description', () => {
        const meta = generateComparisonMeta('MacBook Pro M3', 'Galaxy Book 4 Pro');
        expect(meta.title).toContain('vs');
        expect(meta.title).toContain('MacBook Pro M3');
    });
});
