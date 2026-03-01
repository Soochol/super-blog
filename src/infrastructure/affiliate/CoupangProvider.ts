import crypto from 'crypto';
import { AffiliateProvider, PriceValidationResult } from '../../domains/affiliate/domain/ports/AffiliateProvider';

export class CoupangProvider implements AffiliateProvider {
    private accessKey: string;
    private secretKey: string;

    constructor() {
        const accessKey = process.env.COUPANG_ACCESS_KEY;
        const secretKey = process.env.COUPANG_SECRET_KEY;

        if (!accessKey || !secretKey) {
            throw new Error('CoupangProvider: COUPANG_ACCESS_KEY and COUPANG_SECRET_KEY environment variables are required');
        }

        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    private generateHmacSignature(method: string, uri: string): string {
        const timestamp = this.getFormattedTimestamp();
        const message = timestamp + method + uri;
        const signature = crypto.createHmac('sha256', this.secretKey).update(message).digest('hex');

        return `CEA algorithm=HmacSHA256, access-key=${this.accessKey}, signed-date=${timestamp}, signature=${signature}`;
    }

    private getFormattedTimestamp(): string {
        const date = new Date();
        const year = String(date.getUTCFullYear()).slice(-2);
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }

    async generateLink(originUrl: string): Promise<string> {
        // TODO: wire up actual API call using this.apiFetch('POST', deeplink URI, body)
        return `https://link.coupang.com/re/${this.accessKey}?url=${encodeURIComponent(originUrl)}`;
    }

    async checkLinkValidity(url: string): Promise<boolean> {
        return url.startsWith('https://link.coupang.com/');
    }

    async fetchLowestPrice(_maker: string, _model: string): Promise<number> {
        // TODO: wire up actual API call using this.apiFetch('GET', productSearch URI)
        return 0;
    }

    async validatePriceSearch(_maker: string, _model: string, _searchResultHtml: string): Promise<PriceValidationResult> {
        return {
            isPriceMatch: false,
            actualPrice: 0,
            productNameMatch: false,
        };
    }
}
