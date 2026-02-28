import { ProductReview, ProductStrategy, SentimentAnalysis } from '../Review';
import { ProductSpecs, WebReviewReference } from '../../../product/domain/ProductSpecs';

export interface ContentGenerator {
    generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy>; // AI 전략 수립
    analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis>; // 🔍 외부 리뷰 여론 분석
    generateCritiqueArticle(specs: ProductSpecs, sentiment: SentimentAnalysis, strategy: ProductStrategy): Promise<ProductReview>; // 🔍 비평글 생성
    generateProductReview(productId: string, specsJson: string, strategy: ProductStrategy): Promise<ProductReview>;
    generateComparison(productAId: string, productBId: string): Promise<string>;
}
