export interface ProductStrategy {
    targetAudience: string[];
    keySellingPoints: string[];
    competitors: string[];
    positioning: string;
}

export interface ProductReview {
    summary: string;
    pros: string[];
    cons: string[];
    recommendedFor: string;
    notRecommendedFor: string;
    specHighlights: string[];
    strategy?: ProductStrategy; // AI가 제품 소개에 대한 전략 수립
}

export function validateReviewLength(content: string): boolean {
    return content.length <= 500;
}
