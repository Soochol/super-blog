import { PlaywrightCrawler } from '@/infrastructure/crawler/PlaywrightCrawler';

describe('PlaywrightCrawler Adapter', () => {
    let crawler: PlaywrightCrawler;

    beforeAll(() => {
        crawler = new PlaywrightCrawler();
    });

    afterAll(async () => {
        await crawler.close();
    });

    it('should fetch HTML from a valid URL', async () => {
        // using a lightweight page for fast testing
        const result = await crawler.crawlExistingProduct('https://example.com');
        expect(result.url).toBe('https://example.com');
        expect(result.html).toContain('Example Domain');
        expect(result.html.length).toBeGreaterThan(100);
    }, 30000); // 30s timeout for browser launch
});
