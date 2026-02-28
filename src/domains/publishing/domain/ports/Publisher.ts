import { SeoRoute } from '../SeoRoute';

export interface Publisher {
    scheduleComparisonPageCreate(productAId: string, productBId: string): Promise<boolean>; // 비교 로직 알고리즘
    updateSitemap(routes: SeoRoute[]): Promise<void>;
    notifySearchEngine(url: string): Promise<void>; // 구글 인덱싱 싱크
}
