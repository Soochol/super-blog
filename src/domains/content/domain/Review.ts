export interface ProductStrategy {
    targetAudience: string[];
    keySellingPoints: string[];
    competitors: string[];
    positioning: string;
}

export interface SentimentAnalysis {
    overallScore: number; // 0 to 100
    commonPraises: string[];
    commonComplaints: string[];
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProductReview {
    summary: string;
    pros: string[];
    cons: string[];
    recommendedFor: string;
    notRecommendedFor: string;
    specHighlights: string[];
    strategy?: ProductStrategy; // AI가 제품 소개에 대한 전략 수립
    sentimentAnalysis?: SentimentAnalysis; // 🔍 수집된 외부 여론 분석
}

export function validateReviewLength(content: string): boolean {
    return content.length <= 500;
}
