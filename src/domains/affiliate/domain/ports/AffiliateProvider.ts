export interface PriceValidationResult {
    isPriceMatch: boolean;
    actualPrice: number;
    productNameMatch: boolean; // 실제 그 제품에 대한 가격 검색이 맞는지 AI 검증
}

export interface AffiliateProvider {
    generateLink(originUrl: string): Promise<string>;
    checkLinkValidity(url: string): Promise<boolean>;
    fetchLowestPrice(maker: string, model: string): Promise<number>; // 최저가 검색
    validatePriceSearch(maker: string, model: string, searchResultHtml: string): Promise<PriceValidationResult>; // AI 검증: 실제 그 제품 검색이 맞는지
}
