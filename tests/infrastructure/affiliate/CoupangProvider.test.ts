import { CoupangProvider } from '@/infrastructure/affiliate/CoupangProvider';

describe('CoupangProvider Adapter', () => {
    let provider: CoupangProvider;

    beforeAll(() => {
        process.env.COUPANG_ACCESS_KEY = 'fake-access-key';
        process.env.COUPANG_SECRET_KEY = 'fake-secret-key';
        provider = new CoupangProvider();
    });

    it('should throw if credentials are missing', () => {
        const origAccess = process.env.COUPANG_ACCESS_KEY;
        const origSecret = process.env.COUPANG_SECRET_KEY;
        delete process.env.COUPANG_ACCESS_KEY;
        delete process.env.COUPANG_SECRET_KEY;

        expect(() => new CoupangProvider()).toThrow('COUPANG_ACCESS_KEY and COUPANG_SECRET_KEY');

        process.env.COUPANG_ACCESS_KEY = origAccess;
        process.env.COUPANG_SECRET_KEY = origSecret;
    });

    it('should generate a valid affiliate link', async () => {
        const link = await provider.generateLink('https://example.com/product/123');
        expect(link).toContain('https://link.coupang.com/re/fake-access-key');
        expect(link).toContain(encodeURIComponent('https://example.com/product/123'));
    });

    it('should validate coupang link URLs', async () => {
        expect(await provider.checkLinkValidity('https://link.coupang.com/re/123')).toBe(true);
        expect(await provider.checkLinkValidity('https://other-site.com/link')).toBe(false);
    });
});
