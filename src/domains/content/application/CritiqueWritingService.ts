import { ContentGenerator } from '../domain/ports/ContentGenerator';
import { ProductReview } from '../domain/Review';
import { ProductSpecs, WebReviewReference } from '../../product/domain/ProductSpecs';

export class CritiqueWritingService {
    constructor(private generator: ContentGenerator) { }

    async writeComprehensiveReview(specs: ProductSpecs, webReviews: WebReviewReference[]): Promise<ProductReview> {
        // 1. 여론 분석 + 전략 수립 (독립적이므로 병렬 실행)
        const [sentiment, strategy] = await Promise.all([
            this.generator.analyzeWebSentiments(webReviews),
            this.generator.generateProductStrategy(specs),
        ]);

        // 2. 최종 비평글 작성 (스펙 + 여론 + 전략)
        const article = await this.generator.generateCritiqueArticle(specs, sentiment, strategy);

        return article;
    }
}
