import { ProductSpecs, WebReviewReference } from '../ProductSpecs';
import { RawProductData } from './Crawler';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface SpecExtractor {
    extractSpecs(raw: RawProductData): Promise<ProductSpecs>;
    validateSpecs(specs: ProductSpecs, raw: RawProductData): Promise<ValidationResult>; // AI 가 데이터 검증
    extractWebReviews(rawReviews: RawProductData[]): Promise<WebReviewReference[]>; // 🔍 크롤링된 데이터에서 리뷰 핵심 추출
}
