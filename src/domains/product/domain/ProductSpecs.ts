export interface ProductSpecs {
    maker: string;
    model: string;
    cpu: string;
    ram: number; // GB
    storage: string;
    gpu: string;
    display_size: number;
    weight: number;
    os: string;
    price: number;
}

export interface CrawlHistory {
    url: string;
    htmlHash: string; // MD5/SHA256 해시: 캐싱을 통해 AI 토큰 낭비 방지
    lastCrawledAt: Date;
}

export interface WebReviewReference {
    source: string; // e.g. "YouTube", "Reddit", "Naver Blog"
    url: string;
    summaryText: string;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export function isGamingLaptop(specs: ProductSpecs): boolean {
    return specs.gpu.includes('RTX') || specs.gpu.includes('GTX') || specs.gpu.includes('Radeon RX');
}
