export type ProviderType = 'COUPANG' | 'AMAZON' | 'ELEVENST';

export interface AffiliateLink {
    productId: string;
    provider: ProviderType;
    url: string;
    lastCheckedAt: Date;
    isValid: boolean;
    lowestPriceAtValidation: number;
}

export function createAffiliateLink(provider: ProviderType, affiliateCode: string, originUrl: string): string {
    if (provider === 'COUPANG') {
        return `https://link.coupang.com/re/${affiliateCode}?url=${encodeURIComponent(originUrl)}`;
    }
    return originUrl; // fallback
}
