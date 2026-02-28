# Phase 2: AI 콘텐츠 생성 파이프라인 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** DB에 저장된 제품 스펙을 기반으로 AI 리뷰/비교 기사를 자동 생성하고, 프론트엔드에서 표시하는 파이프라인 완성

**Architecture:** `ContentGenerator` 포트의 구현체 `ClaudeContentGenerator`를 만들어 `ClaudeCliAdapter` + `PrismaSkillRepository`를 조합. CLI 스크립트 `generate-review.ts`와 `generate-comparison.ts`가 이를 호출. 프론트엔드는 이미 `getReviewByProductId()`로 리뷰 표시 가능하므로 비교 기사 표시만 추가.

**Tech Stack:** TypeScript, Prisma, `claude -p` (ClaudeCliAdapter), Jest, Zod

---

### Task 1: ContentGenerator 구현체 — 단위 테스트

**Files:**
- Create: `tests/infrastructure/ai/ClaudeContentGenerator.test.ts`

**Step 1: Write the failing test**

```typescript
import { ClaudeContentGenerator } from '../../../src/infrastructure/ai/ClaudeContentGenerator';
import { LlmRunner } from '../../../src/shared/ai/ports/LlmRunner';
import { SkillRepository } from '../../../src/domains/skill/domain/ports/SkillRepository';
import { AiSkill } from '../../../src/domains/skill/domain/AiSkill';
import { ProductSpecs, WebReviewReference } from '../../../src/domains/product/domain/ProductSpecs';

const makeSkill = (name: string): AiSkill => ({
    id: '1',
    name,
    systemPromptTemplate: 'system: {{category}}',
    userPromptTemplate: 'user: {{maker}} {{model}}',
    temperature: 0.7,
    model: 'claude',
    version: '1.0.0',
});

const mockSpecs: ProductSpecs = {
    maker: 'Apple',
    model: 'MacBook Pro 14',
    cpu: 'M3 Pro',
    ram: 16,
    storage: '512GB SSD',
    gpu: 'M3 Pro 14-core',
    display_size: 14.2,
    weight: 1.6,
    os: 'macOS',
    price: 2390000,
};

describe('ClaudeContentGenerator', () => {
    let mockLlm: jest.Mocked<LlmRunner>;
    let mockSkillRepo: jest.Mocked<SkillRepository>;
    let generator: ClaudeContentGenerator;

    beforeEach(() => {
        mockLlm = { run: jest.fn() };
        mockSkillRepo = {
            findByName: jest.fn(),
            findAll: jest.fn(),
        };
        generator = new ClaudeContentGenerator(mockLlm, mockSkillRepo);
    });

    describe('generateProductReview', () => {
        it('should load generate-review skill and return parsed review', async () => {
            mockSkillRepo.findByName.mockResolvedValue(makeSkill('generate-review'));
            mockLlm.run.mockResolvedValue(JSON.stringify({
                summary: '뛰어난 성능의 프로용 노트북',
                pros: ['빠른 성능', '긴 배터리', '우수한 디스플레이'],
                cons: ['높은 가격', '무거운 무게'],
                recommendedFor: '영상 편집, 개발자',
                notRecommendedFor: '가벼운 웹서핑만 하는 사용자',
                specHighlights: ['M3 Pro 칩', '14.2인치 Liquid Retina XDR'],
            }));

            const review = await generator.generateProductReview(
                'product-1', JSON.stringify(mockSpecs), { targetAudience: [], keySellingPoints: [], competitors: [], positioning: '' }
            );

            expect(review.summary).toBe('뛰어난 성능의 프로용 노트북');
            expect(review.pros).toHaveLength(3);
            expect(review.cons).toHaveLength(2);
            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-review');
            expect(mockLlm.run).toHaveBeenCalledTimes(1);
        });

        it('should throw if generate-review skill not found', async () => {
            mockSkillRepo.findByName.mockResolvedValue(null);
            await expect(
                generator.generateProductReview('p1', '{}', { targetAudience: [], keySellingPoints: [], competitors: [], positioning: '' })
            ).rejects.toThrow('Skill "generate-review" not found');
        });
    });

    describe('generateComparison', () => {
        it('should load generate-comparison skill and return text', async () => {
            mockSkillRepo.findByName.mockResolvedValue(makeSkill('generate-comparison'));
            mockLlm.run.mockResolvedValue('제품 A가 성능 면에서 우위...');

            const result = await generator.generateComparison('product-a', 'product-b');

            expect(result).toContain('제품 A');
            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-comparison');
        });
    });

    describe('generateProductStrategy', () => {
        it('should return parsed strategy from LLM response', async () => {
            mockSkillRepo.findByName.mockResolvedValue(makeSkill('generate-review'));
            mockLlm.run.mockResolvedValue(JSON.stringify({
                targetAudience: ['개발자', '디자이너'],
                keySellingPoints: ['M3 Pro', '배터리'],
                competitors: ['Dell XPS 14'],
                positioning: '프리미엄 크리에이터 노트북',
            }));

            const strategy = await generator.generateProductStrategy(mockSpecs);

            expect(strategy.targetAudience).toContain('개발자');
            expect(strategy.positioning).toBe('프리미엄 크리에이터 노트북');
        });
    });

    describe('analyzeWebSentiments', () => {
        it('should return parsed sentiment from LLM response', async () => {
            const reviews: WebReviewReference[] = [
                { source: 'YouTube', url: 'https://example.com', summaryText: '좋은 노트북', sentiment: 'POSITIVE' },
            ];
            mockSkillRepo.findByName.mockResolvedValue(makeSkill('generate-review'));
            mockLlm.run.mockResolvedValue(JSON.stringify({
                overallScore: 85,
                commonPraises: ['성능 좋음'],
                commonComplaints: ['가격 비쌈'],
                reliability: 'HIGH',
            }));

            const sentiment = await generator.analyzeWebSentiments(reviews);

            expect(sentiment.overallScore).toBe(85);
            expect(sentiment.reliability).toBe('HIGH');
        });
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/infrastructure/ai/ClaudeContentGenerator.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '../../../src/infrastructure/ai/ClaudeContentGenerator'`

---

### Task 2: ContentGenerator 구현체 — 구현

**Files:**
- Create: `src/infrastructure/ai/ClaudeContentGenerator.ts`

**Step 3: Write minimal implementation**

```typescript
import { ContentGenerator } from '../../domains/content/domain/ports/ContentGenerator';
import { ProductReview, ProductStrategy, SentimentAnalysis } from '../../domains/content/domain/Review';
import { ProductSpecs, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { LlmRunner } from '../../shared/ai/ports/LlmRunner';
import { SkillRepository } from '../../domains/skill/domain/ports/SkillRepository';
import { injectContextToPrompt } from '../../domains/skill/domain/AiSkill';

export class ClaudeContentGenerator implements ContentGenerator {
    constructor(
        private llm: LlmRunner,
        private skillRepo: SkillRepository,
    ) {}

    async generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy> {
        const skill = await this.loadSkill('generate-review');
        const prompt = `다음 제품의 마케팅 전략을 JSON으로 작성해줘.
제품: ${specs.maker} ${specs.model}
CPU: ${specs.cpu}, RAM: ${specs.ram}GB, GPU: ${specs.gpu}
가격: ${specs.price}원

JSON 형식: {"targetAudience":[],"keySellingPoints":[],"competitors":[],"positioning":""}`;

        const response = await this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
        return this.parseJson<ProductStrategy>(response);
    }

    async analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis> {
        const skill = await this.loadSkill('generate-review');
        const reviewSummaries = reviews
            .map(r => `[${r.source}] ${r.sentiment}: ${r.summaryText}`)
            .join('\n');

        const prompt = `다음 외부 리뷰들을 분석하여 여론을 JSON으로 요약해줘.

${reviewSummaries}

JSON 형식: {"overallScore":0,"commonPraises":[],"commonComplaints":[],"reliability":"HIGH|MEDIUM|LOW"}`;

        const response = await this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
        return this.parseJson<SentimentAnalysis>(response);
    }

    async generateCritiqueArticle(
        specs: ProductSpecs,
        sentiment: SentimentAnalysis,
        strategy: ProductStrategy,
    ): Promise<ProductReview> {
        return this.generateProductReview(
            '',
            JSON.stringify(specs),
            strategy,
        );
    }

    async generateProductReview(
        productId: string,
        specsJson: string,
        strategy: ProductStrategy,
    ): Promise<ProductReview> {
        const skill = await this.loadSkill('generate-review');
        let specs: ProductSpecs;
        try {
            specs = JSON.parse(specsJson);
        } catch {
            specs = { maker: '', model: '', cpu: '', ram: 0, storage: '', gpu: '', display_size: 0, weight: 0, os: '', price: 0 };
        }

        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            maker: specs.maker ?? '',
            model: specs.model ?? '',
            cpu: specs.cpu ?? '',
            ram: String(specs.ram ?? ''),
            storage: specs.storage ?? '',
            gpu: specs.gpu ?? '',
            display_size: String(specs.display_size ?? ''),
            weight: String(specs.weight ?? ''),
            os: specs.os ?? '',
            price: String(specs.price ?? ''),
        });

        const fullPrompt = `${prompt}\n\n전략 컨텍스트: ${JSON.stringify(strategy)}\n\nJSON으로 답변해줘. 형식: {"summary":"","pros":[],"cons":[],"recommendedFor":"","notRecommendedFor":"","specHighlights":[]}`;

        const response = await this.llm.run(fullPrompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
        return this.parseJson<ProductReview>(response);
    }

    async generateComparison(productAId: string, productBId: string): Promise<string> {
        const skill = await this.loadSkill('generate-comparison');
        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            category: '노트북',
            productA: productAId,
            productB: productBId,
        });

        return this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
    }

    private async loadSkill(name: string) {
        const skill = await this.skillRepo.findByName(name);
        if (!skill) throw new Error(`Skill "${name}" not found`);
        return skill;
    }

    private parseJson<T>(text: string): T {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in LLM response');
        return JSON.parse(jsonMatch[0]) as T;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/infrastructure/ai/ClaudeContentGenerator.test.ts --no-coverage`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/infrastructure/ai/ClaudeContentGenerator.ts tests/infrastructure/ai/ClaudeContentGenerator.test.ts
git commit -m "feat(content): add ClaudeContentGenerator implementing ContentGenerator port"
```

---

### Task 3: generate-review CLI 스크립트 — 테스트

**Files:**
- Create: `tests/cli/generate-review.test.ts`

**Step 1: Write the failing test**

이 테스트는 CLI 스크립트의 핵심 로직인 `generateAndSaveReview` 함수를 테스트합니다. DB 호출은 모킹합니다.

```typescript
import { generateAndSaveReview } from '../../src/cli/generate-review';

// Mock Prisma
jest.mock('../../src/infrastructure/db/PrismaClient', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
        },
        webReviewReference: {
            findMany: jest.fn(),
        },
        productReview: {
            create: jest.fn(),
        },
    },
}));

// Mock ClaudeCliAdapter
jest.mock('../../src/infrastructure/ai/ClaudeCliAdapter', () => ({
    ClaudeCliAdapter: jest.fn().mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(JSON.stringify({
            summary: '테스트 리뷰 요약',
            pros: ['장점1', '장점2', '장점3'],
            cons: ['단점1', '단점2'],
            recommendedFor: '개발자',
            notRecommendedFor: '캐주얼 유저',
            specHighlights: ['M3 Pro'],
        })),
    })),
}));

// Mock PrismaSkillRepository
jest.mock('../../src/infrastructure/db/PrismaSkillRepository', () => ({
    PrismaSkillRepository: jest.fn().mockImplementation(() => ({
        findByName: jest.fn().mockResolvedValue({
            id: '1',
            name: 'generate-review',
            systemPromptTemplate: 'system',
            userPromptTemplate: 'user: {{maker}} {{model}} {{cpu}} {{ram}} {{storage}} {{gpu}} {{display_size}} {{weight}} {{os}} {{price}}',
            temperature: 0.7,
            model: 'claude',
            version: '1.0.0',
        }),
    })),
}));

import { prisma } from '../../src/infrastructure/db/PrismaClient';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('generate-review CLI', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should generate and save review for a product slug', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: 'uuid-1',
            slug: 'apple-macbook-pro-14',
            maker: 'Apple',
            model: 'MacBook Pro 14',
            cpu: 'M3 Pro',
            ram: '16',
            storage: '512GB SSD',
            gpu: 'M3 Pro 14-core',
            displaySize: '14.2',
            weight: 1.6,
            os: 'macOS',
            price: 2390000,
        });
        (mockPrisma.webReviewReference.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.productReview.create as jest.Mock).mockResolvedValue({ id: 'review-1' });

        const result = await generateAndSaveReview('apple-macbook-pro-14');

        expect(result.summary).toBe('테스트 리뷰 요약');
        expect(mockPrisma.productReview.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                productId: 'uuid-1',
                summary: '테스트 리뷰 요약',
                pros: ['장점1', '장점2', '장점3'],
                cons: ['단점1', '단점2'],
            }),
        });
    });

    it('should throw if product not found', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
        await expect(generateAndSaveReview('nonexistent')).rejects.toThrow('Product "nonexistent" not found');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/cli/generate-review.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '../../src/cli/generate-review'`

---

### Task 4: generate-review CLI 스크립트 — 구현

**Files:**
- Create: `src/cli/generate-review.ts`
- Modify: `package.json` (add `pipeline:review` script)

**Step 3: Write implementation**

```typescript
import 'dotenv/config';
import { prisma } from '../infrastructure/db/PrismaClient';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { ClaudeContentGenerator } from '../infrastructure/ai/ClaudeContentGenerator';
import { CritiqueWritingService } from '../domains/content/application/CritiqueWritingService';
import { ProductReview } from '../domains/content/domain/Review';
import { ProductSpecs, WebReviewReference } from '../domains/product/domain/ProductSpecs';

export async function generateAndSaveReview(slug: string): Promise<ProductReview> {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) throw new Error(`Product "${slug}" not found`);

    const specs: ProductSpecs = {
        maker: product.maker,
        model: product.model,
        cpu: product.cpu,
        ram: parseFloat(product.ram),
        storage: product.storage,
        gpu: product.gpu,
        display_size: parseFloat(product.displaySize),
        weight: product.weight,
        os: product.os,
        price: product.price,
    };

    const webReviews = await prisma.webReviewReference.findMany({
        where: { productId: product.id },
    });

    const references: WebReviewReference[] = webReviews.map(r => ({
        source: r.source,
        url: r.url,
        summaryText: r.summaryText,
        sentiment: r.sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
    }));

    const llm = new ClaudeCliAdapter();
    const skillRepo = new PrismaSkillRepository();
    const generator = new ClaudeContentGenerator(llm, skillRepo);
    const service = new CritiqueWritingService(generator);

    const review = await service.writeComprehensiveReview(specs, references);

    await prisma.productReview.create({
        data: {
            productId: product.id,
            summary: review.summary,
            pros: review.pros,
            cons: review.cons,
            recommendedFor: review.recommendedFor,
            notRecommendedFor: review.notRecommendedFor,
            specHighlights: review.specHighlights,
            strategy: review.strategy ?? undefined,
            sentimentAnalysis: review.sentimentAnalysis ?? undefined,
        },
    });

    console.log(`Review saved for: ${product.maker} ${product.model}`);
    return review;
}

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error('Usage: npm run pipeline:review -- <product-slug>');
        console.error('Example: npm run pipeline:review -- apple-macbook-pro-14');
        process.exit(1);
    }

    try {
        const review = await generateAndSaveReview(slug);
        console.log('\n--- Generated Review ---');
        console.log(`Summary: ${review.summary}`);
        console.log(`Pros: ${review.pros.join(', ')}`);
        console.log(`Cons: ${review.cons.join(', ')}`);
        console.log(`Recommended for: ${review.recommendedFor}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

const isDirectRun = process.argv[1]?.includes('generate-review');
if (isDirectRun) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
```

**Step 4: Add npm script to package.json**

`package.json`의 `scripts`에 추가:
```json
"pipeline:review": "npx tsx src/cli/generate-review.ts"
```

**Step 5: Run test to verify it passes**

Run: `npx jest tests/cli/generate-review.test.ts --no-coverage`
Expected: All 2 tests PASS

**Step 6: Commit**

```bash
git add src/cli/generate-review.ts tests/cli/generate-review.test.ts package.json
git commit -m "feat(cli): add generate-review command with CritiqueWritingService pipeline"
```

---

### Task 5: generate-comparison CLI 스크립트 — 테스트

**Files:**
- Create: `tests/cli/generate-comparison.test.ts`

**Step 1: Write the failing test**

```typescript
import { generateAndSaveComparison } from '../../src/cli/generate-comparison';

jest.mock('../../src/infrastructure/db/PrismaClient', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('../../src/infrastructure/ai/ClaudeCliAdapter', () => ({
    ClaudeCliAdapter: jest.fn().mockImplementation(() => ({
        run: jest.fn().mockResolvedValue('MacBook Pro가 성능에서 앞서지만, Galaxy Book은 가성비가 뛰어납니다.'),
    })),
}));

jest.mock('../../src/infrastructure/db/PrismaSkillRepository', () => ({
    PrismaSkillRepository: jest.fn().mockImplementation(() => ({
        findByName: jest.fn().mockResolvedValue({
            id: '1',
            name: 'generate-comparison',
            systemPromptTemplate: 'system',
            userPromptTemplate: '{{category}} 비교: {{productA}} vs {{productB}}',
            temperature: 0.7,
            model: 'claude',
            version: '1.0.0',
        }),
    })),
}));

import { prisma } from '../../src/infrastructure/db/PrismaClient';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('generate-comparison CLI', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should generate comparison text for two products', async () => {
        const productA = {
            id: 'uuid-a', slug: 'apple-macbook-pro-14', maker: 'Apple', model: 'MacBook Pro 14',
            cpu: 'M3 Pro', ram: '16', storage: '512GB', gpu: 'M3 Pro', displaySize: '14.2',
            weight: 1.6, os: 'macOS', price: 2390000, imageUrl: null, couponUrl: null, categoryId: 'laptop',
            createdAt: new Date(), updatedAt: new Date(),
        };
        const productB = {
            id: 'uuid-b', slug: 'samsung-galaxy-book4', maker: 'Samsung', model: 'Galaxy Book4',
            cpu: 'i7-1355U', ram: '16', storage: '512GB', gpu: 'Iris Xe', displaySize: '15.6',
            weight: 1.5, os: 'Windows 11', price: 1290000, imageUrl: null, couponUrl: null, categoryId: 'laptop',
            createdAt: new Date(), updatedAt: new Date(),
        };

        (mockPrisma.product.findUnique as jest.Mock)
            .mockResolvedValueOnce(productA)
            .mockResolvedValueOnce(productB);

        const result = await generateAndSaveComparison('apple-macbook-pro-14', 'samsung-galaxy-book4');

        expect(result).toContain('MacBook Pro');
        expect(mockPrisma.product.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw if either product not found', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(
            generateAndSaveComparison('nonexistent', 'also-nonexistent')
        ).rejects.toThrow('Product "nonexistent" not found');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/cli/generate-comparison.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '../../src/cli/generate-comparison'`

---

### Task 6: generate-comparison CLI 스크립트 — 구현

**Files:**
- Create: `src/cli/generate-comparison.ts`
- Modify: `package.json` (add `pipeline:compare` script)

**Step 3: Write implementation**

```typescript
import 'dotenv/config';
import { prisma } from '../infrastructure/db/PrismaClient';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { ClaudeContentGenerator } from '../infrastructure/ai/ClaudeContentGenerator';

export async function generateAndSaveComparison(slugA: string, slugB: string): Promise<string> {
    const productA = await prisma.product.findUnique({ where: { slug: slugA } });
    if (!productA) throw new Error(`Product "${slugA}" not found`);

    const productB = await prisma.product.findUnique({ where: { slug: slugB } });
    if (!productB) throw new Error(`Product "${slugB}" not found`);

    const llm = new ClaudeCliAdapter();
    const skillRepo = new PrismaSkillRepository();
    const generator = new ClaudeContentGenerator(llm, skillRepo);

    const specsA = `${productA.maker} ${productA.model} (CPU: ${productA.cpu}, RAM: ${productA.ram}GB, GPU: ${productA.gpu}, 화면: ${productA.displaySize}인치, 무게: ${productA.weight}kg, 가격: ${productA.price}원)`;
    const specsB = `${productB.maker} ${productB.model} (CPU: ${productB.cpu}, RAM: ${productB.ram}GB, GPU: ${productB.gpu}, 화면: ${productB.displaySize}인치, 무게: ${productB.weight}kg, 가격: ${productB.price}원)`;

    const comparison = await generator.generateComparison(specsA, specsB);

    console.log(`Comparison generated: ${productA.maker} ${productA.model} vs ${productB.maker} ${productB.model}`);
    return comparison;
}

async function main() {
    const slugA = process.argv[2];
    const slugB = process.argv[3];
    if (!slugA || !slugB) {
        console.error('Usage: npm run pipeline:compare -- <slug-a> <slug-b>');
        console.error('Example: npm run pipeline:compare -- apple-macbook-pro-14 samsung-galaxy-book4');
        process.exit(1);
    }

    try {
        const comparison = await generateAndSaveComparison(slugA, slugB);
        console.log('\n--- Generated Comparison ---');
        console.log(comparison);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

const isDirectRun = process.argv[1]?.includes('generate-comparison');
if (isDirectRun) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
```

**Step 4: Add npm script to package.json**

`package.json`의 `scripts`에 추가:
```json
"pipeline:compare": "npx tsx src/cli/generate-comparison.ts"
```

**Step 5: Run test to verify it passes**

Run: `npx jest tests/cli/generate-comparison.test.ts --no-coverage`
Expected: All 2 tests PASS

**Step 6: Commit**

```bash
git add src/cli/generate-comparison.ts tests/cli/generate-comparison.test.ts package.json
git commit -m "feat(cli): add generate-comparison command for product comparison articles"
```

---

### Task 7: 프론트엔드 비교 기사 연동 — 테스트 없음 (프론트엔드 변경)

비교 페이지에서 AI 비교 기사를 표시하도록 연동합니다. 현재 비교 페이지는 스펙 테이블만 있습니다.

**Files:**
- Modify: `src/lib/api.ts` — `getComparisonText` 함수 추가
- Modify: `src/app/[categoryId]/compare/[ids]/page.tsx` — 비교 기사 섹션 추가

**Step 1: api.ts에 비교 기사 조회 함수 추가**

`src/lib/api.ts` 하단에 추가:

```typescript
export const getComparisonReviews = async (
    productIdA: string,
    productIdB: string
): Promise<{ reviewA?: Review; reviewB?: Review }> => {
    const [reviewA, reviewB] = await Promise.all([
        getReviewByProductId(productIdA),
        getReviewByProductId(productIdB),
    ]);
    return { reviewA, reviewB };
};
```

**Step 2: 비교 페이지에 리뷰 데이터 표시**

`src/app/[categoryId]/compare/[ids]/page.tsx`의 `ComparePage` 컴포넌트에서, `ProductSpecTable` 아래에 각 제품의 AI 리뷰 요약을 나란히 표시:

`getReviewByProductId`를 import하고, 두 제품의 리뷰를 fetch한 뒤 표시합니다.

페이지 컴포넌트 내부 (`const [productA, productB] = ...` 뒤)에 추가:

```typescript
const [reviewA, reviewB] = await Promise.all([
    getReviewByProductId(productA.id),
    getReviewByProductId(productB.id),
]);
```

스펙 테이블 섹션 (`</div>`) 아래에 JSX 추가:

```tsx
{(reviewA || reviewB) && (
    <div className="mb-10">
        <h3 className="text-3xl font-black text-white bg-black inline-block px-4 py-2 mb-8 border-4 border-black shadow-hard uppercase">
            AI 리뷰 비교
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviewA && (
                <div className="bg-neo-blue p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h4 className="text-xl font-black text-black mb-4 bg-white px-2 py-1 border-2 border-black inline-block">{productA.name}</h4>
                    <p className="text-black font-bold mb-4">"{reviewA.summary}"</p>
                    <div className="space-y-2">
                        {reviewA.pros.map((p, i) => (
                            <p key={i} className="text-black font-bold">► {p}</p>
                        ))}
                    </div>
                </div>
            )}
            {reviewB && (
                <div className="bg-neo-pink p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h4 className="text-xl font-black text-black mb-4 bg-white px-2 py-1 border-2 border-black inline-block">{productB.name}</h4>
                    <p className="text-black font-bold mb-4">"{reviewB.summary}"</p>
                    <div className="space-y-2">
                        {reviewB.pros.map((p, i) => (
                            <p key={i} className="text-black font-bold">► {p}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
)}
```

**Step 3: Build 확인**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add src/lib/api.ts src/app/[categoryId]/compare/[ids]/page.tsx
git commit -m "feat(frontend): add AI review comparison section to compare page"
```

---

### Task 8: 전체 통합 검증

**Step 1: 전체 테스트 실행**

Run: `npx jest --no-coverage`
Expected: All tests PASS

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: Build succeeds

**Step 3: 린트 확인**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: fix lint/build issues from Phase 2 implementation"
```
