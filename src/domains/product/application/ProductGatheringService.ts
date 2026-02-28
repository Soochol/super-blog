import { Crawler } from '../domain/ports/Crawler';
import { SpecExtractor } from '../domain/ports/SpecExtractor';
import { ProductSpecs, WebReviewReference } from '../domain/ProductSpecs';

export class ProductGatheringService {
    constructor(private crawler: Crawler, private extractor: SpecExtractor) { }

    async gatherProductAndReviews(url: string, searchKeyword: string): Promise<{ specs: ProductSpecs; references: WebReviewReference[] }> {
        // 1. 공홈 스펙 크롤링 + 외부 리뷰 수집 (독립적이므로 병렬 실행)
        const [rawSpec, rawReviews] = await Promise.all([
            this.crawler.crawlExistingProduct(url),
            this.crawler.searchWebForReviews(searchKeyword),
        ]);

        // 2. 스펙 추출 + 리뷰 추출 (독립적이므로 병렬 실행)
        const [specs, references] = await Promise.all([
            this.extractor.extractSpecs(rawSpec),
            this.extractor.extractWebReviews(rawReviews),
        ]);

        return { specs, references };
    }
}
