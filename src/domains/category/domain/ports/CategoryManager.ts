import { CategoryRule } from '../CategoryRule';

export interface CategoryAssignments {
    productId: string;
    categoryIds: string[];
}

export interface CategoryManager {
    categorizeNewProduct(productId: string): Promise<CategoryAssignments>; // 신제품 스펙 기반 카테고리 자동 배정
    getFeaturedProducts(categoryId: string, limit: number): Promise<string[]>; // 추천/베스트 상품 랭킹 조회
}
