import { ProductSpecs, CrawlHistory, WebReviewReference } from '../ProductSpecs';

export interface ProductRepository {
    saveProduct(slug: string, specs: ProductSpecs): Promise<string>; // returns product id (upsert)
    saveCrawlHistory(productId: string, history: CrawlHistory): Promise<void>;
    saveWebReviews(productId: string, reviews: WebReviewReference[]): Promise<void>;
    findBySlug(slug: string): Promise<ProductSpecs | null>;
}
