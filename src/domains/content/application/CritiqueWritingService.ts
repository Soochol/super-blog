import { ContentGenerator } from '../domain/ports/ContentGenerator';
import { ProductSpecs, WebReviewReference } from '../../product/domain/ProductSpecs';

export class CritiqueWritingService {
    constructor(private generator: ContentGenerator) { }

    async writeComprehensiveReview(specs: ProductSpecs, webReviews: WebReviewReference[]) {
        // 1. 여론 분석 (웹 리뷰 기반)
        const sentiment = await this.generator.analyzeWebSentiments(webReviews);

        // 2. 전략 수립 (스펙 기반)
        const strategy = await this.generator.generateProductStrategy(specs);

        // 3. 최종 비평글 작성 (스펙 + 여론 + 전략)
        const article = await this.generator.generateCritiqueArticle(specs, sentiment, strategy);

        return article;
    }
}
