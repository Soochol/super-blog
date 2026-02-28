export interface RawProductData {
    url: string;
    html: string;
}

export interface Crawler {
    discoverNewProducts(makerHomepageUrl: string): Promise<string[]>; // 신규 제품 출시 -> 홈페이지 크롤링
    crawlExistingProduct(url: string): Promise<RawProductData>; // 기존 제품 -> 홈페이지 크롤링
    checkIfRegisteredOnHomepage(maker: string, model: string): Promise<boolean>; // 홈페이지 등록 여부
}
