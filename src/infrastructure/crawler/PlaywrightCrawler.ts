import { chromium, Browser } from 'playwright';
import { Crawler, RawProductData } from '../../domains/product/domain/ports/Crawler';

export class PlaywrightCrawler implements Crawler {
    private browser: Browser | null = null;

    private async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await chromium.launch({ headless: true });
        }
        return this.browser;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async discoverNewProducts(_makerHomepageUrl: string): Promise<string[]> {
        // Basic implementation for MVP. Would need site-specific logic in reality.
        return [];
    }

    async crawlExistingProduct(url: string): Promise<RawProductData> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
            // Block unnecessary resources to speed up crawling
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff2}', route => route.abort());

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Wait briefly for JS-rendered content to populate
            await page.waitForTimeout(3000);
            const html = await page.content();

            return { url, html };
        } finally {
            await page.close();
        }
    }

    async checkIfRegisteredOnHomepage(_maker: string, _model: string): Promise<boolean> {
        return true; // Simplified for MVP
    }

    async searchWebForReviews(_keyword: string): Promise<RawProductData[]> {
        // E.g. search Google/Naver and return top 3 URLs html 
        return [];
    }
}
