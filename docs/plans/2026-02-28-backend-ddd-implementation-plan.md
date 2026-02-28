# Backend DDD Structure Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** `docs/domains` (01~05) 문서의 요구사항을 반영하여 유지보수와 확장에 유리한 백엔드 비즈니스 로직용 DDD(Domain-Driven Design) 폴더 구조와 핵심 도메인 인터페이스를 구축한다.

**Architecture:** 
- `src/domains/` 하위에 핵심 서브도메인인 `skill`(AI 프롬프트/전략 관리), `product`(제품 수집/검증/웹리뷰), `content`(AI 콘텐츠 생성/비평), `affiliate`(제휴 링크 연동), `analytics`(데이터 추적), `publishing`(SEO 및 페이지 생성 관리), `category`(제품 분류 및 큐레이션 규칙)를 생성한다.
- `src/shared/` 하위에 여러 도메인에서 공통으로 쓰는 인프라성 핵심 로직(`ai`(공통 AI 클라이언트), `events`(도메인 이벤트 Pub/Sub))을 둔다.
- 계층화(Layering) 상세:
  - **Domain Layer**: 엔티티, 밸류 오브젝트, 도메인 서비스, Port 인터페이스 (예: `Review.ts`, `ports/ContentGenerator.ts`)
  - **Application Layer**: 유스케이스(Use Case)를 오케스트레이션 하는 서비스 (예: `ProductScrapingService.ts`, `ReviewCritiqueService.ts`)
  - **Infrastructure Layer**: Port 인터페이스의 실제 구현체 (예: `PlaywrightCrawler.ts`, `OpenAiGenerator.ts`)
- 초안 단계이므로 핵심 `domain`과 외부 연동을 위한 `ports`(인터페이스)를 먼저 정의하고, 이번 구체화 단계에서 주요 Application Service의 뼈대를 추가한다.

**Tech Stack:** TypeScript, Jest

---

### Task 1: Product Domain (제품 데이터 수집 및 스펙)

**Files:**
- Create: `src/domains/product/domain/ProductSpecs.ts`
- Create: `src/domains/product/domain/ports/Crawler.ts`
- Create: `src/domains/product/domain/ports/SpecExtractor.ts`
- Create: `tests/domains/product/domain/ProductSpecs.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/product/domain/ProductSpecs.test.ts
import { isGamingLaptop } from '../../../../src/domains/product/domain/ProductSpecs';

describe('ProductSpecs Domain Logic', () => {
  it('should identify a gaming laptop based on gpu', () => {
    expect(isGamingLaptop({ gpu: 'RTX 4060' } as any)).toBe(true);
    expect(isGamingLaptop({ gpu: 'Intel Iris Xe' } as any)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/product/domain/ProductSpecs.test.ts`
Expected: FAIL (Cannot find module)

**Step 3: Write minimal implementation**

```typescript
// src/domains/product/domain/ProductSpecs.ts
export interface ProductSpecs {
  maker: string;
  model: string;
  cpu: string;
  ram: number; // GB
  storage: string;
  gpu: string;
  display_size: number;
  weight: number;
  os: string;
  price: number;
}

export interface CrawlHistory {
  url: string;
  htmlHash: string; // MD5/SHA256 해시: 캐싱을 통해 AI 토큰 낭비 방지
  lastCrawledAt: Date;
}

export interface WebReviewReference {
  source: string; // e.g. "YouTube", "Reddit", "Naver Blog"
  url: string;
  summaryText: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export function isGamingLaptop(specs: ProductSpecs): boolean {
  return specs.gpu.includes('RTX') || specs.gpu.includes('GTX') || specs.gpu.includes('Radeon RX');
}

// src/domains/product/domain/ports/Crawler.ts
export interface RawProductData {
  url: string;
  html: string;
}

export interface Crawler {
  discoverNewProducts(makerHomepageUrl: string): Promise<string[]>; // 신규 제품 출시 -> 홈페이지 크롤링
  crawlExistingProduct(url: string): Promise<RawProductData>; // 기존 제품 -> 홈페이지 크롤링
  checkIfRegisteredOnHomepage(maker: string, model: string): Promise<boolean>; // 홈페이지 등록 여부
  searchWebForReviews(keyword: string): Promise<RawProductData[]>; // 🔍 외부 커뮤니티 리뷰 검색/크롤링
}

// src/domains/product/domain/ports/SpecExtractor.ts
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

// src/domains/product/application/ProductGatheringService.ts
// ✅ Application Layer: 유스케이스 오케스트레이션
import { Crawler } from '../domain/ports/Crawler';
import { SpecExtractor } from '../domain/ports/SpecExtractor';

export class ProductGatheringService {
  constructor(private crawler: Crawler, private extractor: SpecExtractor) {}

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
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/product/domain/ProductSpecs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/product/domain/ProductSpecs.test.ts src/domains/product/domain/ProductSpecs.ts src/domains/product/domain/ports/Crawler.ts src/domains/product/domain/ports/SpecExtractor.ts
git commit -m "feat(product): add product domain specs, crawler and extractor ports"
```

---

### Task 2: Content Domain (AI 콘텐츠 생성)

**Files:**
- Create: `src/domains/content/domain/Review.ts`
- Create: `src/domains/content/domain/ports/ContentGenerator.ts`
- Create: `tests/domains/content/domain/Review.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/content/domain/Review.test.ts
import { validateReviewLength } from '../../../../src/domains/content/domain/Review';

describe('Review Domain Logic', () => {
  it('should validate review length to be under 500 characters', () => {
    expect(validateReviewLength('Short review')).toBe(true);
    expect(validateReviewLength('a'.repeat(501))).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/content/domain/Review.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/content/domain/Review.ts
export interface ProductStrategy {
  targetAudience: string[];
  keySellingPoints: string[];
  competitors: string[];
  positioning: string;
}

export interface SentimentAnalysis {
  overallScore: number; // 0 to 100
  commonPraises: string[];
  commonComplaints: string[];
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProductReview {
  summary: string;
  pros: string[];
  cons: string[];
  recommendedFor: string;
  notRecommendedFor: string;
  specHighlights: string[];
  strategy?: ProductStrategy; // AI가 제품 소개에 대한 전략 수립
  sentimentAnalysis?: SentimentAnalysis; // 🔍 수집된 외부 여론 분석
}

export function validateReviewLength(content: string): boolean {
  return content.length <= 500;
}

// src/domains/content/domain/ports/ContentGenerator.ts
import { ProductReview, ProductStrategy, SentimentAnalysis } from '../Review';
import { ProductSpecs, WebReviewReference } from '../../../product/domain/ProductSpecs';

export interface ContentGenerator {
  generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy>; // AI 전략 수립
  analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis>; // 🔍 외부 리뷰 여론 분석
  generateCritiqueArticle(specs: ProductSpecs, sentiment: SentimentAnalysis, strategy: ProductStrategy): Promise<ProductReview>; // 🔍 비평글 생성
  generateProductReview(productId: string, specsJson: string, strategy: ProductStrategy): Promise<ProductReview>;
  generateComparison(productAId: string, productBId: string): Promise<string>;
}

// src/domains/content/application/CritiqueWritingService.ts
// ✅ Application Layer: 리뷰 분석 및 비평글 작성 오케스트레이션
import { ContentGenerator } from '../domain/ports/ContentGenerator';
import { ProductSpecs, WebReviewReference } from '../../../product/domain/ProductSpecs';

export class CritiqueWritingService {
  constructor(private generator: ContentGenerator) {}

  async writeComprehensiveReview(specs: ProductSpecs, webReviews: WebReviewReference[]) {
    // 1. 여론 분석 (웹 리뷰 기반)
    const sentiment = await this.generator.analyzeWebSentiments(webReviews);
    
    // 2. 전략 수립 (스펙 기반)
    const strategy = await this.generator.generateProductStrategy(specs);
    
    // 3. 최종 비평글 작성 (스펙 + 여론 + 전략)
    const article = await this.generator.generateCritiqueArticle(specs, sentiment, strategy);
    
    return article;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/content/domain/Review.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/content/domain/Review.test.ts src/domains/content/domain/Review.ts src/domains/content/domain/ports/ContentGenerator.ts
git commit -m "feat(content): add content domain entities and generator port"
```

---

### Task 3: Affiliate Domain (제휴 링크 파트너스 연동)

**Files:**
- Create: `src/domains/affiliate/domain/AffiliateLink.ts`
- Create: `src/domains/affiliate/domain/ports/AffiliateProvider.ts`
- Create: `tests/domains/affiliate/domain/AffiliateLink.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/affiliate/domain/AffiliateLink.test.ts
import { createAffiliateLink } from '../../../../src/domains/affiliate/domain/AffiliateLink';

describe('AffiliateLink Domain Logic', () => {
  it('should append affiliate pattern for Coupang', () => {
    const url = createAffiliateLink('COUPANG', 'AFF123', 'https://coupang.com/p/1');
    expect(url).toContain('AFF123');
    expect(url).toContain('link.coupang.com');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/affiliate/domain/AffiliateLink.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/affiliate/domain/AffiliateLink.ts
export type ProviderType = 'COUPANG' | 'AMAZON' | 'ELEVENST';

export interface AffiliateLink {
  productId: string;
  provider: ProviderType;
  url: string;
  lastCheckedAt: Date;
  isValid: boolean;
  lowestPriceAtValidation: number;
}

export function createAffiliateLink(provider: ProviderType, affiliateCode: string, originUrl: string): string {
  if (provider === 'COUPANG') {
    return `https://link.coupang.com/re/${affiliateCode}?url=${encodeURIComponent(originUrl)}`;
  }
  return originUrl; // fallback
}

// src/domains/affiliate/domain/ports/AffiliateProvider.ts
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
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/affiliate/domain/AffiliateLink.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/affiliate/domain/AffiliateLink.test.ts src/domains/affiliate/domain/AffiliateLink.ts src/domains/affiliate/domain/ports/AffiliateProvider.ts
git commit -m "feat(affiliate): add generic affiliate link domain and provider port"
```

---

### Task 4: Analytics Domain (분석 및 최적화)

**Files:**
- Create: `src/domains/analytics/domain/Event.ts`
- Create: `src/domains/analytics/domain/ports/AnalyticsTracker.ts`
- Create: `tests/domains/analytics/domain/Event.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/analytics/domain/Event.test.ts
import { createCtaClickEvent } from '../../../../src/domains/analytics/domain/Event';

describe('Analytics Event Domain Logic', () => {
  it('should format a CTA click event correctly', () => {
    const event = createCtaClickEvent('prod-1', 'product_detail', 'top', 'A');
    expect(event.eventName).toBe('cta_click');
    expect(event.payload.product_id).toBe('prod-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/analytics/domain/Event.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/analytics/domain/Event.ts
export interface TrackingEvent {
  eventName: string;
  payload: Record<string, any>;
  timestamp: Date;
}

export function createCtaClickEvent(
  productId: string,
  pageType: 'product_detail' | 'comparison' | 'category',
  ctaPosition: 'top' | 'middle' | 'bottom',
  ctaVariant: string
): TrackingEvent {
  return {
    eventName: 'cta_click',
    payload: { product_id: productId, page_type: pageType, cta_position: ctaPosition, cta_variant: ctaVariant },
    timestamp: new Date()
  };
}

// src/domains/analytics/domain/ports/AnalyticsTracker.ts
import { TrackingEvent } from '../Event';

export interface AnalyticsTracker {
  trackEvent(event: TrackingEvent): Promise<void>;
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/analytics/domain/Event.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/analytics/domain/Event.test.ts src/domains/analytics/domain/Event.ts src/domains/analytics/domain/ports/AnalyticsTracker.ts
git commit -m "feat(analytics): add analytics event domain and tracker port"
```

---

### Task 5: Skill & Shared Domain (AI 컨텍스트 및 시스템 공통)

**Files:**
- Create: `src/domains/skill/domain/AiSkill.ts`
- Create: `src/shared/ai/ports/AiClient.ts`
- Create: `src/shared/events/DomainEvent.ts`
- Create: `tests/domains/skill/domain/AiSkill.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/skill/domain/AiSkill.test.ts
import { injectContextToPrompt } from '../../../../src/domains/skill/domain/AiSkill';

describe('Skill Domain Logic', () => {
  it('should inject dynamic context into skill prompt', () => {
    const prompt = 'Act as a {persona} and analyze {productName}.';
    const result = injectContextToPrompt(prompt, { persona: 'Reviewer', productName: 'MacBook' });
    expect(result).toBe('Act as a Reviewer and analyze MacBook.');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/skill/domain/AiSkill.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/skill/domain/AiSkill.ts
export interface AiSkill {
  id: string;
  name: string; // e.g., 'gaming_laptop_review_v1'
  systemPromptTemplate: string;
  userPromptTemplate: string;
  temperature: number;
  model: 'gpt-4o' | 'claude-3-5';
  version: string;
}

export function injectContextToPrompt(template: string, context: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// src/shared/ai/ports/AiClient.ts
export interface AiPromptParams {
  systemPrompt: string;
  userPrompt: string;
  responseSchema?: any;
}

export interface AiClient { // 모든 도메인이 공통으로 사용할 AI 인터페이스
  generateStructuredData<T>(params: AiPromptParams): Promise<T>;
  validateMatch(sourceText: string, targetData: any): Promise<boolean>;
}

// src/shared/events/DomainEvent.ts
export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/skill/domain/AiSkill.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/skill/domain/AiSkill.test.ts src/domains/skill/domain/AiSkill.ts src/shared/ai/ports/AiClient.ts src/shared/events/DomainEvent.ts
git commit -m "feat(skill,shared): add skill domain entities and shared ai/event ports"
```

---

### Task 6: Publishing Domain (SEO 및 페이지 렌더링 전략 관리)

**Files:**
- Create: `src/domains/publishing/domain/SeoRoute.ts`
- Create: `src/domains/publishing/domain/ports/Publisher.ts`
- Create: `tests/domains/publishing/domain/SeoRoute.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/publishing/domain/SeoRoute.test.ts
import { generateComparisonMeta } from '../../../../src/domains/publishing/domain/SeoRoute';

describe('Publishing Domain Logic', () => {
  it('should generate accurate comparison title and description', () => {
    const meta = generateComparisonMeta('MacBook Pro M3', 'Galaxy Book 4 Pro');
    expect(meta.title).toContain('vs');
    expect(meta.title).toContain('MacBook Pro M3');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/publishing/domain/SeoRoute.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/publishing/domain/SeoRoute.ts
export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export interface SeoRoute {
  path: string; // e.g. /compare/macbook-pro-vs-galaxy-book
  type: 'product_detail' | 'comparison' | 'category' | 'guide';
  meta: SeoMetadata;
  lastPublishedAt: Date;
}

export function generateComparisonMeta(productA: string, productB: string): SeoMetadata {
  return {
    title: `${productA} vs ${productB} 비교 - 2026년 가성비 추천`,
    description: `${productA}와 ${productB}의 스펙, 디자인, 가격 포인트를 완벽 비교 분석해드립니다.`,
    keywords: [productA, productB, '노트북 비교', '추천']
  };
}

// src/domains/publishing/domain/ports/Publisher.ts
import { SeoRoute } from '../SeoRoute';

export interface Publisher {
  scheduleComparisonPageCreate(productAId: string, productBId: string): Promise<boolean>; // 비교 로직 알고리즘
  updateSitemap(routes: SeoRoute[]): Promise<void>;
  notifySearchEngine(url: string): Promise<void>; // 구글 인덱싱 싱크
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/publishing/domain/SeoRoute.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/publishing/domain/SeoRoute.test.ts src/domains/publishing/domain/SeoRoute.ts src/domains/publishing/domain/ports/Publisher.ts
git commit -m "feat(publishing): add publishing domain for SEO and page generation"
```

---

### Task 7: Category Domain (상품 분류 및 큐레이션 관리)

**Files:**
- Create: `src/domains/category/domain/CategoryRule.ts`
- Create: `src/domains/category/domain/ports/CategoryManager.ts`
- Create: `tests/domains/category/domain/CategoryRule.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/domains/category/domain/CategoryRule.test.ts
import { isEligibleForCategory } from '../../../../src/domains/category/domain/CategoryRule';

describe('CategoryRule Domain Logic', () => {
  it('should correctly filter products for ultra-light category', () => {
    const rule = {
      maxWeight: 1.2,
    };
    expect(isEligibleForCategory(rule, { weight: 0.98 } as any)).toBe(true);
    expect(isEligibleForCategory(rule, { weight: 1.5 } as any)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/domains/category/domain/CategoryRule.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/domains/category/domain/CategoryRule.ts
import { ProductSpecs } from '../../product/domain/ProductSpecs';

export interface CategoryRule {
  categoryId: string;
  name: string; // e.g. "초경량 노트북"
  maxWeight?: number;
  minPrice?: number;
  maxPrice?: number;
  requiredGpuFamily?: string[]; // e.g. ["RTX", "GTX"]
}

export function isEligibleForCategory(rule: CategoryRule, specs: ProductSpecs): boolean {
  if (rule.maxWeight !== undefined && specs.weight > rule.maxWeight) return false;
  if (rule.minPrice !== undefined && specs.price < rule.minPrice) return false;
  if (rule.maxPrice !== undefined && specs.price > rule.maxPrice) return false;
  
  if (rule.requiredGpuFamily && rule.requiredGpuFamily.length > 0) {
    const hasGpu = rule.requiredGpuFamily.some(gpu => specs.gpu.includes(gpu));
    if (!hasGpu) return false;
  }
  
  return true;
}

// src/domains/category/domain/ports/CategoryManager.ts
import { CategoryRule } from '../CategoryRule';

export interface CategoryAssignments {
  productId: string;
  categoryIds: string[];
}

export interface CategoryManager {
  categorizeNewProduct(productId: string): Promise<CategoryAssignments>; // 신제품 스펙 기반 카테고리 자동 배정
  getFeaturedProducts(categoryId: string, limit: number): Promise<string[]>; // 추천/베스트 상품 랭킹 조회
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/domains/category/domain/CategoryRule.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/domains/category/domain/CategoryRule.test.ts src/domains/category/domain/CategoryRule.ts src/domains/category/domain/ports/CategoryManager.ts
git commit -m "feat(category): add category domain for curation and auto-filtering rules"
```
