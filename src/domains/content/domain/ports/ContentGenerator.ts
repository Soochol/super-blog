import { ProductReview, ProductStrategy } from '../Review';
import { ProductSpecs } from '../../../product/domain/ProductSpecs';

export interface ContentGenerator {
    generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy>; // AI 전략 수립
    generateProductReview(productId: string, specsJson: string, strategy: ProductStrategy): Promise<ProductReview>;
    generateComparison(productAId: string, productBId: string): Promise<string>;
}
