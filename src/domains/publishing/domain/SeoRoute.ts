export interface SeoMetadata {
    title: string;
    description: string;
    keywords: string[];
}

export interface SeoRoute {
    path: string; // e.g. /compare/macbook-pro-vs-galaxy-book
    type: 'product_detail' | 'comparison' | 'category' | 'guide';
    meta: SeoMetadata;
    lastPublishedAt: Date;
}

export function generateComparisonMeta(productA: string, productB: string): SeoMetadata {
    return {
        title: `${productA} vs ${productB} 비교 - 2026년 가성비 추천`,
        description: `${productA}와 ${productB}의 스펙, 디자인, 가격 포인트를 완벽 비교 분석해드립니다.`,
        keywords: [productA, productB, '노트북 비교', '추천']
    };
}
