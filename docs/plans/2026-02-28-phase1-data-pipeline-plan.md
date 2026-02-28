# Phase 1: 데이터 파이프라인 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 정적 JSON 기반 데이터를 PostgreSQL(Docker) + Prisma로 전환하고, CLI 스크립트로 크롤링→추출→저장 파이프라인을 실동작시킨다.

**Architecture:** Docker Compose로 PostgreSQL 실행, Prisma ORM으로 데이터 접근, `src/cli/`에 CLI 스크립트를 두어 터미널에서 파이프라인 실행. Next.js `src/lib/api.ts`는 Prisma 쿼리로 교체하되 프론트엔드 타입 계약(Product, Category, Review)은 유지.

**Tech Stack:** Docker Compose, PostgreSQL 17, Prisma 7, tsx (CLI runner), Playwright (크롤링), Gemini API (스펙 추출)

---

## 스키마 불일치 정리

api.ts 매핑 레이어가 해결해야 할 차이:

| 프론트엔드 타입 | Prisma 모델 | 해결 방법 |
|---|---|---|
| `id`: slug 문자열 (`macbook-pro-16`) | `id`: UUID | Product에 `slug` 필드 추가 |
| `name`: 전체 이름 | `maker` + `model` 분리 | 쿼리 시 결합 |
| `brand`: 브랜드명 | `maker` | 필드명 매핑 |
| `specs`: 중첩 객체 | 플랫 컬럼들 | 쿼리 결과에서 조립 |
| `specs.display` | `displaySize` | 필드명 매핑 |
| `Review.rating`: number | `ProductReview.rating`: Float? | nullable → default 0 처리 |

---

### Task 1: Docker Compose + 환경 설정

**Files:**
- Create: `docker-compose.yml`
- Create: `.env`
- Modify: `.gitignore` — `.env` 추가 확인
- Modify: `package.json` — `dotenv` 의존성 + 스크립트 추가

**Step 1: docker-compose.yml 작성**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: superblog
      POSTGRES_USER: superblog
      POSTGRES_PASSWORD: superblog
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: .env 파일 생성**

```env
DATABASE_URL="postgresql://superblog:superblog@localhost:5432/superblog"
```

**Step 3: .gitignore에 .env 추가 확인**

`.gitignore`에 `.env`가 없으면 추가.

**Step 4: dotenv 설치 + tsx 설치**

```bash
npm install dotenv
npm install -D tsx
```

`dotenv`는 `prisma.config.ts`에서 이미 import하고 있으나 `package.json`에 없음. `tsx`는 TypeScript CLI 스크립트 실행용.

**Step 5: package.json에 스크립트 추가**

```json
{
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx tsx src/cli/seed.ts",
    "db:reset": "npx prisma migrate reset",
    "pipeline:crawl": "npx tsx src/cli/crawl.ts",
    "pipeline:all": "npx tsx src/cli/pipeline.ts"
  }
}
```

**Step 6: Docker 컨테이너 시작 확인**

```bash
npm run db:up
docker compose ps
```

Expected: `db` 서비스가 running 상태

**Step 7: 커밋**

```bash
git add docker-compose.yml .env.example .gitignore package.json package-lock.json
git commit -m "chore: add docker compose for postgresql and cli tooling"
```

Note: `.env`는 커밋하지 않고 `.env.example` (비밀번호 없는 템플릿)을 커밋.

---

### Task 2: Prisma 스키마에 slug 필드 추가

**Files:**
- Modify: `prisma/schema.prisma` — `Product` 모델에 `slug` 필드 추가

**Step 1: Product 모델에 slug 추가**

`prisma/schema.prisma`의 `Product` 모델에 추가:

```prisma
model Product {
  id           String   @id @default(uuid())
  slug         String   @unique
  maker        String
  model        String
  cpu          String
  ram          String
  storage      String
  gpu          String
  displaySize  String
  weight       Float
  os           String
  price        Int
  imageUrl     String?
  couponUrl    String?
  categoryId   String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  crawls       CrawlHistory[]
  reviews      WebReviewReference[]
  critiques    ProductReview[]
  categories   CategoryAssignment[]

  @@index([categoryId])
}
```

핵심 변경: `slug String @unique` 추가. 프론트엔드 라우팅에서 URL ID로 사용.

**Step 2: 마이그레이션 실행**

```bash
npm run db:migrate -- --name add-product-slug
```

Expected: `prisma/migrations/` 디렉토리에 마이그레이션 파일 생성, DB에 적용 완료

**Step 3: Prisma Client 재생성 확인**

```bash
npx prisma generate
```

**Step 4: 커밋**

```bash
git add prisma/
git commit -m "feat(db): add slug field to product model"
```

---

### Task 3: Seed 스크립트 작성 (JSON → DB 이관)

**Files:**
- Create: `src/cli/seed.ts`
- Test: `src/cli/seed.ts` — 직접 실행하여 데이터 확인

**Step 1: seed 스크립트 작성**

```typescript
// src/cli/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import categoriesData from '../data/categories.json';
import productsData from '../data/products.json';
import reviewsData from '../data/reviews.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Categories
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description },
      create: { id: cat.id, name: cat.name, description: cat.description },
    });
    console.log(`  Category: ${cat.name}`);
  }

  // 2. Products
  for (const prod of productsData as any[]) {
    const product = await prisma.product.upsert({
      where: { slug: prod.id },
      update: {},
      create: {
        slug: prod.id,
        maker: prod.brand,
        model: prod.name.replace(`${prod.brand} `, '').replace(`${prod.brand}전자 `, ''),
        cpu: prod.specs.cpu,
        ram: prod.specs.ram,
        storage: prod.specs.storage,
        gpu: prod.specs.gpu,
        displaySize: prod.specs.display,
        weight: prod.specs.weight,
        os: prod.specs.os,
        price: prod.price,
        imageUrl: prod.imageUrl,
        couponUrl: prod.couponUrl,
        categoryId: prod.categoryId,
      },
    });

    // CategoryAssignment
    await prisma.categoryAssignment.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: prod.categoryId,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: prod.categoryId,
      },
    });

    console.log(`  Product: ${prod.name}`);
  }

  // 3. Reviews
  for (const rev of reviewsData as any[]) {
    const product = await prisma.product.findUnique({
      where: { slug: rev.productId },
    });
    if (!product) {
      console.warn(`  Skipping review: product ${rev.productId} not found`);
      continue;
    }

    await prisma.productReview.upsert({
      where: { id: `seed-${rev.productId}` },
      update: {},
      create: {
        id: `seed-${rev.productId}`,
        productId: product.id,
        summary: rev.summary,
        pros: rev.pros,
        cons: rev.cons,
        rating: rev.rating,
        recommendedFor: '',
        notRecommendedFor: '',
        specHighlights: [],
      },
    });
    console.log(`  Review for: ${rev.productId}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

**Step 2: seed 실행**

```bash
npm run db:seed
```

Expected: "Seeding complete!" 출력, 카테고리 1개, 제품 3개, 리뷰 3개 생성

**Step 3: 데이터 확인**

```bash
npx prisma studio
```

Prisma Studio에서 Product, Category, ProductReview 테이블에 데이터가 있는지 시각적 확인.

**Step 4: 커밋**

```bash
git add src/cli/seed.ts
git commit -m "feat(cli): add database seed script for json data migration"
```

---

### Task 4: api.ts를 Prisma 쿼리로 교체 (TDD)

**Files:**
- Modify: `src/lib/api.ts` — JSON import → Prisma 쿼리
- Create: `tests/lib/api.test.ts` — 통합 테스트
- Reference: `src/types/index.ts` — 반환 타입 계약 유지

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/lib/api.test.ts
import { getCategories, getCategoryById, getProductsByCategory, getProductById, getReviewByProductId } from '@/lib/api';

// 이 테스트는 실제 DB 연결이 필요 (통합 테스트)
// DB에 seed 데이터가 있어야 함

describe('api (Prisma)', () => {
  test('getCategories returns all categories', async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty('id');
    expect(categories[0]).toHaveProperty('name');
    expect(categories[0]).toHaveProperty('description');
  });

  test('getCategoryById returns correct category', async () => {
    const category = await getCategoryById('laptop');
    expect(category).toBeDefined();
    expect(category!.name).toBe('노트북');
  });

  test('getProductsByCategory returns products with nested specs', async () => {
    const products = await getProductsByCategory('laptop');
    expect(products.length).toBe(3);
    const product = products[0];
    expect(product).toHaveProperty('id');      // slug
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('brand');
    expect(product).toHaveProperty('specs');
    expect(product.specs).toHaveProperty('cpu');
    expect(product.specs).toHaveProperty('display');
    expect(typeof product.specs.weight).toBe('number');
  });

  test('getProductById returns single product by slug', async () => {
    const product = await getProductById('macbook-pro-16');
    expect(product).toBeDefined();
    expect(product!.brand).toBe('Apple');
  });

  test('getReviewByProductId returns review by product slug', async () => {
    const review = await getReviewByProductId('macbook-pro-16');
    expect(review).toBeDefined();
    expect(review!.rating).toBe(4.8);
    expect(review!.pros.length).toBeGreaterThan(0);
  });
});
```

**Step 2: 테스트 실행하여 실패 확인**

```bash
npx jest tests/lib/api.test.ts
```

Expected: 현재 JSON 기반이므로 import 방식이 달라 테스트 구조에 따라 실패하거나, 변경 후 Prisma 연결 관련 실패

**Step 3: api.ts를 Prisma 쿼리로 교체**

```typescript
// src/lib/api.ts
import { prisma } from '../infrastructure/db/PrismaClient';
import { Category, Product, Review } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  const categories = await prisma.category.findMany();
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? '',
  }));
};

export const getCategoryById = async (id: string): Promise<Category | undefined> => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return undefined;
  return { id: category.id, name: category.name, description: category.description ?? '' };
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const products = await prisma.product.findMany({
    where: { categoryId },
  });
  return products.map(mapProductToFrontend);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const product = await prisma.product.findUnique({ where: { slug: id } });
  if (!product) return undefined;
  return mapProductToFrontend(product);
};

export const getReviewByProductId = async (productId: string): Promise<Review | undefined> => {
  const product = await prisma.product.findUnique({ where: { slug: productId } });
  if (!product) return undefined;

  const review = await prisma.productReview.findFirst({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!review) return undefined;

  return {
    productId,
    summary: review.summary,
    pros: review.pros,
    cons: review.cons,
    rating: review.rating ?? 0,
  };
};

function mapProductToFrontend(p: {
  slug: string; maker: string; model: string; cpu: string; ram: string;
  storage: string; gpu: string; displaySize: string; weight: number;
  os: string; price: number; imageUrl: string | null; couponUrl: string | null;
  categoryId: string | null;
}): Product {
  return {
    id: p.slug,
    categoryId: p.categoryId ?? '',
    name: `${p.maker} ${p.model}`,
    price: p.price,
    brand: p.maker,
    specs: {
      cpu: p.cpu,
      ram: p.ram,
      storage: p.storage,
      gpu: p.gpu,
      display: p.displaySize,
      weight: p.weight,
      os: p.os,
    },
    imageUrl: p.imageUrl ?? '',
    couponUrl: p.couponUrl,
  };
}
```

**Step 4: 테스트 실행하여 통과 확인**

```bash
npx jest tests/lib/api.test.ts
```

Expected: 5개 테스트 모두 PASS (DB에 seed 데이터가 있어야 함)

**Step 5: Next.js 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공. 기존 페이지들이 Prisma 데이터로 정상 렌더링

**Step 6: 커밋**

```bash
git add src/lib/api.ts tests/lib/api.test.ts
git commit -m "feat: replace json data layer with prisma queries"
```

---

### Task 5: ProductRepository 포트 + Prisma 구현 (TDD)

**Files:**
- Create: `src/domains/product/domain/ports/ProductRepository.ts`
- Create: `src/infrastructure/db/PrismaProductRepository.ts`
- Create: `tests/infrastructure/db/PrismaProductRepository.test.ts`

CLI 파이프라인에서 크롤링 결과를 DB에 저장하려면, 도메인 포트를 통한 저장 인터페이스가 필요.

**Step 1: ProductRepository 포트 정의**

```typescript
// src/domains/product/domain/ports/ProductRepository.ts
import { ProductSpecs, CrawlHistory, WebReviewReference } from '../ProductSpecs';

export interface ProductRepository {
  saveProduct(slug: string, specs: ProductSpecs): Promise<string>; // returns product id
  saveCrawlHistory(productId: string, history: CrawlHistory): Promise<void>;
  saveWebReviews(productId: string, reviews: WebReviewReference[]): Promise<void>;
  findBySlug(slug: string): Promise<ProductSpecs | null>;
}
```

**Step 2: 실패하는 테스트 작성**

```typescript
// tests/infrastructure/db/PrismaProductRepository.test.ts
import { PrismaProductRepository } from '@/infrastructure/db/PrismaProductRepository';
import { ProductSpecs } from '@/domains/product/domain/ProductSpecs';
import { prisma } from '@/infrastructure/db/PrismaClient';

const repo = new PrismaProductRepository();

const testSpecs: ProductSpecs = {
  maker: 'TestBrand',
  model: 'TestModel X1',
  cpu: 'Intel i7',
  ram: 16,
  storage: '512GB SSD',
  gpu: 'RTX 4060',
  display_size: 15.6,
  weight: 2.1,
  os: 'Windows 11',
  price: 1500000,
};

describe('PrismaProductRepository', () => {
  afterAll(async () => {
    await prisma.product.deleteMany({ where: { slug: 'test-model-x1' } });
    await prisma.$disconnect();
  });

  test('saveProduct creates a product and returns id', async () => {
    const id = await repo.saveProduct('test-model-x1', testSpecs);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('findBySlug returns saved product', async () => {
    const found = await repo.findBySlug('test-model-x1');
    expect(found).not.toBeNull();
    expect(found!.maker).toBe('TestBrand');
    expect(found!.cpu).toBe('Intel i7');
  });

  test('saveCrawlHistory stores crawl record', async () => {
    const product = await prisma.product.findUnique({ where: { slug: 'test-model-x1' } });
    await repo.saveCrawlHistory(product!.id, {
      url: 'https://example.com/test',
      htmlHash: 'abc123',
      lastCrawledAt: new Date(),
    });
    const crawls = await prisma.crawlHistory.findMany({ where: { productId: product!.id } });
    expect(crawls.length).toBe(1);
  });
});
```

**Step 3: 테스트 실행하여 실패 확인**

```bash
npx jest tests/infrastructure/db/PrismaProductRepository.test.ts
```

Expected: FAIL — `PrismaProductRepository` 모듈 없음

**Step 4: PrismaProductRepository 구현**

```typescript
// src/infrastructure/db/PrismaProductRepository.ts
import { ProductRepository } from '../../domains/product/domain/ports/ProductRepository';
import { ProductSpecs, CrawlHistory, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { prisma } from './PrismaClient';

export class PrismaProductRepository implements ProductRepository {
  async saveProduct(slug: string, specs: ProductSpecs): Promise<string> {
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        maker: specs.maker,
        model: specs.model,
        cpu: specs.cpu,
        ram: `${specs.ram}GB`,
        storage: specs.storage,
        gpu: specs.gpu,
        displaySize: `${specs.display_size}인치`,
        weight: specs.weight,
        os: specs.os,
        price: specs.price,
      },
      create: {
        slug,
        maker: specs.maker,
        model: specs.model,
        cpu: specs.cpu,
        ram: `${specs.ram}GB`,
        storage: specs.storage,
        gpu: specs.gpu,
        displaySize: `${specs.display_size}인치`,
        weight: specs.weight,
        os: specs.os,
        price: specs.price,
      },
    });
    return product.id;
  }

  async saveCrawlHistory(productId: string, history: CrawlHistory): Promise<void> {
    await prisma.crawlHistory.create({
      data: {
        productId,
        url: history.url,
        htmlHash: history.htmlHash,
        lastCrawledAt: history.lastCrawledAt,
      },
    });
  }

  async saveWebReviews(productId: string, reviews: WebReviewReference[]): Promise<void> {
    for (const review of reviews) {
      await prisma.webReviewReference.create({
        data: {
          productId,
          source: review.source,
          url: review.url,
          summaryText: review.summaryText,
          sentiment: review.sentiment,
        },
      });
    }
  }

  async findBySlug(slug: string): Promise<ProductSpecs | null> {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return null;
    return {
      maker: product.maker,
      model: product.model,
      cpu: product.cpu,
      ram: parseInt(product.ram) || 0,
      storage: product.storage,
      gpu: product.gpu,
      display_size: parseFloat(product.displaySize) || 0,
      weight: product.weight,
      os: product.os,
      price: product.price,
    };
  }
}
```

**Step 5: 테스트 실행하여 통과 확인**

```bash
npx jest tests/infrastructure/db/PrismaProductRepository.test.ts
```

Expected: 3개 테스트 PASS

**Step 6: 커밋**

```bash
git add src/domains/product/domain/ports/ProductRepository.ts src/infrastructure/db/PrismaProductRepository.ts tests/infrastructure/db/PrismaProductRepository.test.ts
git commit -m "feat(db): add product repository port and prisma implementation"
```

---

### Task 6: CLI 크롤링 스크립트 (TDD)

**Files:**
- Create: `src/cli/crawl.ts`
- Create: `tests/cli/crawl.test.ts`
- Reference: `src/infrastructure/crawler/PlaywrightCrawler.ts`
- Reference: `src/infrastructure/ai/AiSpecExtractor.ts`
- Reference: `src/infrastructure/db/PrismaProductRepository.ts`

**Step 1: 실패하는 테스트 작성**

크롤링 자체는 외부 의존성이므로, 파이프라인 오케스트레이션 함수를 단위 테스트.

```typescript
// tests/cli/crawl.test.ts
import { buildSlug } from '@/cli/crawl';

describe('crawl CLI utils', () => {
  test('buildSlug generates url-friendly slug from maker and model', () => {
    expect(buildSlug('Apple', '맥북 프로 16 M4 Max')).toBe('apple-맥북-프로-16-m4-max');
  });

  test('buildSlug handles spaces and special characters', () => {
    expect(buildSlug('ASUS', 'ROG Strix G16')).toBe('asus-rog-strix-g16');
  });
});
```

**Step 2: 테스트 실행하여 실패 확인**

```bash
npx jest tests/cli/crawl.test.ts
```

Expected: FAIL — `@/cli/crawl` 모듈 없음

**Step 3: crawl.ts 구현**

```typescript
// src/cli/crawl.ts
import 'dotenv/config';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { AiSpecExtractor } from '../infrastructure/ai/AiSpecExtractor';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ProductGatheringService } from '../domains/product/application/ProductGatheringService';

export function buildSlug(maker: string, model: string): string {
  return `${maker}-${model}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣\-]/g, '');
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npm run pipeline:crawl -- <product-url>');
    process.exit(1);
  }

  const searchKeyword = process.argv[3] || '';
  const crawler = new PlaywrightCrawler();
  const extractor = new AiSpecExtractor();
  const repo = new PrismaProductRepository();
  const service = new ProductGatheringService(crawler, extractor);

  try {
    console.log(`Crawling: ${url}`);
    const { specs, references } = await service.gatherProductAndReviews(url, searchKeyword);

    const slug = buildSlug(specs.maker, specs.model);
    console.log(`Extracted: ${specs.maker} ${specs.model} (slug: ${slug})`);

    const productId = await repo.saveProduct(slug, specs);
    console.log(`Saved product: ${productId}`);

    await repo.saveCrawlHistory(productId, {
      url,
      htmlHash: Buffer.from(url).toString('base64').substring(0, 32),
      lastCrawledAt: new Date(),
    });

    if (references.length > 0) {
      await repo.saveWebReviews(productId, references);
      console.log(`Saved ${references.length} web reviews`);
    }

    console.log('Done!');
  } finally {
    await crawler.close();
  }
}

// CLI 직접 실행 시에만 main() 호출
const isDirectRun = process.argv[1]?.includes('crawl');
if (isDirectRun) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
```

**Step 4: 테스트 실행하여 통과 확인**

```bash
npx jest tests/cli/crawl.test.ts
```

Expected: 2개 테스트 PASS

**Step 5: 수동 테스트 (실제 크롤링)**

```bash
npm run pipeline:crawl -- "https://www.apple.com/macbook-pro/"
```

Expected: 크롤링 → Gemini 스펙 추출 → DB 저장. 콘솔에 진행 상황 출력.

Note: Gemini API 키가 `.env`에 `GOOGLE_GENERATIVE_AI_API_KEY`로 설정되어 있어야 함.

**Step 6: 커밋**

```bash
git add src/cli/crawl.ts tests/cli/crawl.test.ts
git commit -m "feat(cli): add crawl command for product data pipeline"
```

---

### Task 7: CLI 파이프라인 오케스트레이터

**Files:**
- Create: `src/cli/pipeline.ts`

이 태스크는 여러 URL을 순차 크롤링하는 배치 스크립트.

**Step 1: pipeline.ts 작성**

```typescript
// src/cli/pipeline.ts
import 'dotenv/config';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { AiSpecExtractor } from '../infrastructure/ai/AiSpecExtractor';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ProductGatheringService } from '../domains/product/application/ProductGatheringService';
import { buildSlug } from './crawl';

// 크롤링 대상 URL 목록 (추후 설정 파일이나 DB로 이동 가능)
const TARGETS = [
  { url: 'https://www.apple.com/shop/buy-mac/macbook-pro', keyword: 'MacBook Pro 리뷰' },
  { url: 'https://www.samsung.com/sec/galaxybook/', keyword: '갤럭시북 리뷰' },
];

async function main() {
  const crawler = new PlaywrightCrawler();
  const extractor = new AiSpecExtractor();
  const repo = new PrismaProductRepository();
  const service = new ProductGatheringService(crawler, extractor);

  console.log(`Pipeline starting: ${TARGETS.length} targets`);

  for (const target of TARGETS) {
    try {
      console.log(`\n--- Crawling: ${target.url} ---`);
      const { specs, references } = await service.gatherProductAndReviews(target.url, target.keyword);

      const slug = buildSlug(specs.maker, specs.model);
      const productId = await repo.saveProduct(slug, specs);
      console.log(`Saved: ${specs.maker} ${specs.model} (${slug})`);

      await repo.saveCrawlHistory(productId, {
        url: target.url,
        htmlHash: Buffer.from(target.url).toString('base64').substring(0, 32),
        lastCrawledAt: new Date(),
      });

      if (references.length > 0) {
        await repo.saveWebReviews(productId, references);
        console.log(`  + ${references.length} web reviews`);
      }
    } catch (error) {
      console.error(`Error processing ${target.url}:`, error);
    }
  }

  await crawler.close();
  console.log('\nPipeline complete!');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Step 2: 실행 테스트**

```bash
npm run pipeline:all
```

Expected: 각 타겟 URL에 대해 크롤링 → 추출 → 저장 순서로 실행

**Step 3: 커밋**

```bash
git add src/cli/pipeline.ts
git commit -m "feat(cli): add pipeline orchestrator for batch crawling"
```

---

### Task 8: 기존 테스트 + 빌드 전체 검증

**Files:** 없음 (검증만)

**Step 1: 전체 테스트 실행**

```bash
npx jest
```

Expected: 기존 도메인 테스트 + 새 테스트 모두 PASS

**Step 2: 빌드 확인**

```bash
npm run build
```

Expected: Next.js 빌드 성공. Prisma 기반 데이터로 모든 페이지 정상 생성

**Step 3: dev 서버에서 수동 확인**

```bash
npm run dev
```

`http://localhost:3000` 접속하여:
- 홈페이지 카테고리 표시
- `/laptop` 제품 목록 표시
- 제품 상세 페이지 정상
- 비교 페이지 정상

**Step 4: 정적 JSON 파일 정리 (선택)**

DB 전환이 확인되면 `src/data/` 디렉토리의 JSON 파일은 seed 스크립트의 소스로만 유지. `src/lib/api.ts`에서의 JSON import는 이미 제거됨.

**Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: verify phase 1 data pipeline integration"
```
