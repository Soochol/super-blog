import { CoupangProvider } from '@/infrastructure/affiliate/CoupangProvider';

describe('CoupangProvider Adapter', () => {
    let provider: CoupangProvider;

    beforeAll(() => {
        // Injecting fake secrets for testing HMAC generation
        process.env.COUPANG_ACCESS_KEY = 'fake-access-key';
        process.env.COUPANG_SECRET_KEY = 'fake-secret-key';
        provider = new CoupangProvider();
    });

    it('should generate a valid HMAC signature format', () => {
        // Expose a protected method for testing or test the public flow if mocked
        const signature = provider.generateHmacSignature('GET', '/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=test');

        // Check if signature matches Coupang's format: CEA algorithm=HmacSHA256, access-key=..., signed-date=..., signature=...
        expect(signature).toMatch(/^CEA algorithm=HmacSHA256, access-key=fake-access-key, signed-date=\d{6}T\d{6}Z, signature=[a-f0-9]{64}$/);
    });
});
