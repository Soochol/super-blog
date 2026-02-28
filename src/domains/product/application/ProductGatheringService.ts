import { Crawler } from '../domain/ports/Crawler';
import { SpecExtractor } from '../domain/ports/SpecExtractor';

export class ProductGatheringService {
    constructor(private crawler: Crawler, private extractor: SpecExtractor) { }

    async gatherProductAndReviews(url: string, searchKeyword: string) {
        // 1. 공홈 스펙 크롤링 및 추출
        const rawSpec = await this.crawler.crawlExistingProduct(url);
        const specs = await this.extractor.extractSpecs(rawSpec);

        // 2. 외부 커뮤니티/블로그 리뷰 수집
        const rawReviews = await this.crawler.searchWebForReviews(searchKeyword);
        const references = await this.extractor.extractWebReviews(rawReviews);

        // 3. (추후 레포지토리 저장 로직)
        return { specs, references };
    }
}
