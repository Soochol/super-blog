# Phase 3 & 4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 클릭 추적(3.1), SEO 자동화(3.2), 검색/모바일메뉴/법률페이지(4.1), 랭킹/가이드 페이지(4.2) 구현

**Architecture:** 헥사고날 아키텍처 유지. `PrismaAnalyticsTracker`는 기존 `AnalyticsTracker` 포트 구현. SEO는 Next.js App Router 내장 방식(`sitemap.ts`, `robots.ts`). 검색은 Next.js Route Handler. Header는 `'use client'` 전환.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Prisma 7, Tailwind CSS 4, Jest 30

---

## Task 1: PrismaAnalyticsTracker 구현

**Files:**
- Create: `src/infrastructure/analytics/PrismaAnalyticsTracker.ts`
- Create: `tests/infrastructure/analytics/PrismaAnalyticsTracker.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/infrastructure/analytics/PrismaAnalyticsTracker.test.ts
import { PrismaAnalyticsTracker } from '@/infrastructure/analytics/PrismaAnalyticsTracker';
import { createCtaClickEvent } from '@/domains/analytics/domain/Event';

const mockCreate = jest.fn().mockResolvedValue({});
jest.mock('@/infrastructure/db/PrismaClient', () => ({
  prisma: {
    eventLog: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe('PrismaAnalyticsTracker', () => {
  const tracker = new PrismaAnalyticsTracker();

  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('trackEvent saves cta_click to EventLog', async () => {
    const event = createCtaClickEvent('product-1', 'product_detail', 'bottom', 'primary');

    await tracker.trackEvent(event);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        eventName: 'cta_click',
        payload: {
          product_id: 'product-1',
          page_type: 'product_detail',
          cta_position: 'bottom',
          cta_variant: 'primary',
        },
        timestamp: event.timestamp,
      },
    });
  });
});
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd /home/dev/code/super-blog
npx jest tests/infrastructure/analytics/PrismaAnalyticsTracker.test.ts
```

Expected: FAIL — `Cannot find module '@/infrastructure/analytics/PrismaAnalyticsTracker'`

**Step 3: 구현**

```typescript
// src/infrastructure/analytics/PrismaAnalyticsTracker.ts
import { AnalyticsTracker } from '@/domains/analytics/domain/ports/AnalyticsTracker';
import { TrackingEvent } from '@/domains/analytics/domain/Event';
import { prisma } from '@/infrastructure/db/PrismaClient';

export class PrismaAnalyticsTracker implements AnalyticsTracker {
  async trackEvent(event: TrackingEvent): Promise<void> {
    await prisma.eventLog.create({
      data: {
        eventName: event.eventName,
        payload: event.payload,
        timestamp: event.timestamp,
      },
    });
  }
}
```

**Step 4: 테스트 실행 → 통과 확인**

```bash
npx jest tests/infrastructure/analytics/PrismaAnalyticsTracker.test.ts
```

Expected: PASS

**Step 5: 커밋**

```bash
git add src/infrastructure/analytics/PrismaAnalyticsTracker.ts tests/infrastructure/analytics/PrismaAnalyticsTracker.test.ts
git commit -m "feat(analytics): implement PrismaAnalyticsTracker"
```

---

## Task 2: Server Action + BuyButtonCTA 클릭 추적 연결

**Files:**
- Create: `src/app/actions/analytics.ts`
- Modify: `src/components/monetization/BuyButtonCTA.tsx`

**Step 1: Server Action 작성**

```typescript
// src/app/actions/analytics.ts
'use server';

import { PrismaAnalyticsTracker } from '@/infrastructure/analytics/PrismaAnalyticsTracker';
import { createCtaClickEvent } from '@/domains/analytics/domain/Event';

const tracker = new PrismaAnalyticsTracker();

export async function trackCtaClick(
  productId: string,
  pageType: 'product_detail' | 'comparison' | 'category',
  ctaPosition: 'top' | 'middle' | 'bottom',
  ctaVariant: string,
): Promise<void> {
  const event = createCtaClickEvent(productId, pageType, ctaPosition, ctaVariant);
  await tracker.trackEvent(event);
}
```

**Step 2: BuyButtonCTA props 추가 및 onClick 연결**

`src/components/monetization/BuyButtonCTA.tsx`의 `BuyButtonCTAProps` 인터페이스에 추가:

```typescript
interface BuyButtonCTAProps {
    url: string;
    price: number;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    productId?: string;
    pageType?: 'product_detail' | 'comparison' | 'category';
    ctaPosition?: 'top' | 'middle' | 'bottom';
}
```

컴포넌트 상단에 import 추가:
```typescript
import { trackCtaClick } from '@/app/actions/analytics';
```

props 구조분해에 추가:
```typescript
export default function BuyButtonCTA({
    url,
    price,
    variant = 'primary',
    size = 'md',
    className = '',
    productId,
    pageType = 'product_detail',
    ctaPosition = 'bottom',
}: BuyButtonCTAProps) {
```

onClick 핸들러를 다음으로 교체:
```typescript
onClick={() => {
    if (productId) {
        trackCtaClick(productId, pageType, ctaPosition, variant);
    }
}}
```

**Step 3: ProductDetailPage에서 BuyButtonCTA에 props 전달**

`src/app/[categoryId]/[productId]/page.tsx`에서 BuyButtonCTA 두 곳에 props 추가:

상단 CTA (제품 헤더 안):
```tsx
<BuyButtonCTA
    url={product.couponUrl || '#'}
    price={product.price}
    size="lg"
    variant="secondary"
    className="w-full sm:w-auto"
    productId={product.id}
    pageType="product_detail"
    ctaPosition="top"
/>
```

하단 CTA (페이지 맨 아래):
```tsx
<BuyButtonCTA
    url={product.couponUrl || '#'}
    price={product.price}
    size="lg"
    variant="primary"
    className="w-full md:w-auto min-w-[250px]"
    productId={product.id}
    pageType="product_detail"
    ctaPosition="bottom"
/>
```

**Step 4: 빌드 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

**Step 5: 커밋**

```bash
git add src/app/actions/analytics.ts src/components/monetization/BuyButtonCTA.tsx src/app/\[categoryId\]/\[productId\]/page.tsx
git commit -m "feat(analytics): connect CTA click tracking via Server Action"
```

---

## Task 3: sitemap.ts + robots.ts

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Step 1: sitemap.ts 작성**

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getCategories, getProductsByCategory } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const categories = await getCategories();

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (
    await Promise.all(
      categories.map(async (cat) => {
        const products = await getProductsByCategory(cat.id);
        return products.map((p) => ({
          url: `${baseUrl}/${cat.id}/${p.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      })
    )
  ).flat();

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...categoryRoutes,
    ...productRoutes,
  ];
}
```

**Step 2: robots.ts 작성**

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**Step 3: 환경변수 추가**

`.env.local` (없으면 생성):
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Step 4: dev 서버에서 /sitemap.xml 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/sitemap.xml`, `http://localhost:3000/robots.txt` 접속 → XML/텍스트 응답 확인.

**Step 5: 커밋**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): add sitemap.xml and robots.txt via Next.js App Router"
```

---

## Task 4: JSON-LD 구조화 데이터

**Files:**
- Modify: `src/app/[categoryId]/[productId]/page.tsx`
- Modify: `src/app/[categoryId]/compare/[ids]/page.tsx`

**Step 1: 제품 상세 페이지에 JSON-LD 추가**

`src/app/[categoryId]/[productId]/page.tsx`의 `ProductDetailPage` 함수에서 return 직전에 JSON-LD 스크립트 추가. `<div className="container mx-auto ...">` 바로 위에 삽입:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: review?.summary ?? `${product.name} 상세 스펙 및 리뷰`,
  brand: { '@type': 'Brand', name: product.brand },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'KRW',
    availability: 'https://schema.org/InStock',
    url: product.couponUrl ?? undefined,
  },
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 기존 JSX 그대로 유지 */}
    </div>
  </>
);
```

**Step 2: 비교 페이지에 JSON-LD 추가**

`src/app/[categoryId]/compare/[ids]/page.tsx`의 페이지 컴포넌트 return에 `<>` 래퍼와 JSON-LD 추가 (기존 컴포넌트 return 구조 파악 후 동일 패턴 적용):

두 제품 각각 `ItemList` 스키마:
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: `${productA.name} vs ${productB.name} 비교`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: productA.name, url: `/${categoryId}/${productA.id}` },
    { '@type': 'ListItem', position: 2, name: productB.name, url: `/${categoryId}/${productB.id}` },
  ],
};
```

**Step 3: 빌드 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

**Step 4: 커밋**

```bash
git add src/app/\[categoryId\]/\[productId\]/page.tsx src/app/\[categoryId\]/compare/\[ids\]/page.tsx
git commit -m "feat(seo): add JSON-LD structured data to product and comparison pages"
```

---

## Task 5: 검색 API Route Handler

**Files:**
- Create: `src/app/api/search/route.ts`

**Step 1: Route Handler 작성**

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/PrismaClient';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { maker: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      slug: true,
      maker: true,
      model: true,
      imageUrl: true,
      categoryId: true,
    },
    take: 8,
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.slug,
      name: `${p.maker} ${p.model}`,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
    }))
  );
}
```

**Step 2: dev 서버에서 수동 테스트**

```bash
curl "http://localhost:3000/api/search?q=맥북"
```

Expected: JSON 배열 (또는 빈 배열 — DB에 데이터 없을 경우)

**Step 3: 커밋**

```bash
git add src/app/api/search/route.ts
git commit -m "feat(search): add GET /api/search route handler"
```

---

## Task 6: Header — 검색 UI + 모바일 메뉴

**Files:**
- Modify: `src/components/layout/Header.tsx`

Header를 `'use client'`로 전환하고 검색 + 모바일 메뉴 상태 추가.

**Step 1: Header.tsx 전체 교체**

```typescript
'use client';

import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  name: string;
  categoryId: string | null;
  imageUrl: string | null;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json());
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    if (result.categoryId) {
      router.push(`/${result.categoryId}/${result.id}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-black bg-neo-yellow px-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                SUPER BLOG
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/laptop" className="text-base font-bold text-black hover:text-neo-pink transition-colors">
                노트북 리뷰
              </Link>
              <Link href="/laptop/rank/price" className="text-base font-bold text-black hover:text-neo-pink transition-colors">
                랭킹
              </Link>
              <Link href="/guide/gaming-laptop-guide" className="text-base font-bold text-black hover:text-neo-pink transition-colors">
                가이드
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
              <input
                type="search"
                placeholder="제품 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-64 border-2 border-black bg-white pl-10 pr-4 text-sm font-bold text-black outline-none focus:bg-neo-blue/10 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500"
              />
              {(results.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-black shadow-hard z-50">
                  {isSearching && (
                    <div className="px-4 py-3 text-sm font-bold text-black">검색 중...</div>
                  )}
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleResultClick(r)}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-black hover:bg-neo-yellow border-b-2 border-black last:border-b-0 transition-colors"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-black hover:bg-neo-yellow border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6 font-bold" />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-72 bg-white border-l-4 border-black flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-4 border-black">
              <span className="text-xl font-black text-black bg-neo-yellow px-2 border-2 border-black">MENU</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 border-2 border-black hover:bg-neo-pink transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              {[
                { href: '/laptop', label: '노트북 리뷰' },
                { href: '/laptop/rank/price', label: '랭킹' },
                { href: '/guide/gaming-laptop-guide', label: '가이드' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-base font-black text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

**Step 3: 커밋**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(ui): add search dropdown and mobile drawer menu to Header"
```

---

## Task 7: /terms, /privacy 페이지

**Files:**
- Create: `src/app/terms/page.tsx`
- Create: `src/app/privacy/page.tsx`

**Step 1: terms 페이지 작성**

```tsx
// src/app/terms/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | Super Blog',
  description: 'Super Blog 이용약관',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-yellow inline-block px-4 py-2 border-4 border-black shadow-hard">
        이용약관
      </h1>
      <div className="bg-white border-4 border-black shadow-hard p-8 space-y-6 font-bold text-black leading-relaxed">
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제1조 (목적)</h2>
          <p>본 약관은 Super Blog(이하 "서비스")의 이용 조건 및 절차, 운영자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제2조 (서비스 내용)</h2>
          <p>서비스는 노트북 스펙 비교, AI 리뷰 제공, 쿠팡 파트너스 제휴 링크를 통한 최저가 안내를 제공합니다. 제품 가격 및 스펙 정보는 변경될 수 있으며, 실제 구매 전 공식 사이트에서 확인하시기 바랍니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제3조 (제휴 마케팅)</h2>
          <p>본 서비스는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 이는 구매자에게 추가 비용을 발생시키지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">제4조 (면책)</h2>
          <p>서비스는 정보 제공 목적으로 운영되며, 제품 구매 결과에 대한 책임을 지지 않습니다.</p>
        </section>
        <p className="text-sm text-gray-600 border-t-2 border-black pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  );
}
```

**Step 2: privacy 페이지 작성**

```tsx
// src/app/privacy/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Super Blog',
  description: 'Super Blog 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-blue inline-block px-4 py-2 border-4 border-black shadow-hard text-white">
        개인정보처리방침
      </h1>
      <div className="bg-white border-4 border-black shadow-hard p-8 space-y-6 font-bold text-black leading-relaxed">
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">수집하는 정보</h2>
          <p>본 서비스는 회원가입 없이 이용 가능하며, 별도의 개인정보를 수집하지 않습니다. 다만 서비스 개선을 위해 방문 패턴, CTA 클릭 이벤트 등의 익명 통계 정보를 수집합니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">쿠키 및 외부 서비스</h2>
          <p>쿠팡 파트너스 링크 클릭 시 쿠팡의 개인정보처리방침이 적용됩니다. 본 서비스는 쿠팡의 쿠키 정책에 따라 제휴 추적 쿠키가 설정될 수 있습니다.</p>
        </section>
        <section>
          <h2 className="text-xl font-black mb-3 border-b-4 border-black pb-2">문의</h2>
          <p>개인정보 관련 문의사항은 GitHub Issues를 통해 접수해주세요.</p>
        </section>
        <p className="text-sm text-gray-600 border-t-2 border-black pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  );
}
```

**Step 3: 커밋**

```bash
git add src/app/terms/page.tsx src/app/privacy/page.tsx
git commit -m "feat(pages): add /terms and /privacy static pages"
```

---

## Task 8: 랭킹 페이지

**Files:**
- Create: `src/app/laptop/rank/[criterion]/page.tsx`

**Step 1: 랭킹 페이지 작성**

```tsx
// src/app/laptop/rank/[criterion]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/infrastructure/db/PrismaClient';

const CRITERIA = {
  price: { label: '가성비 (저가순)', orderBy: { price: 'asc' } as const, color: 'bg-neo-green' },
  weight: { label: '휴대성 (경량순)', orderBy: { weight: 'asc' } as const, color: 'bg-neo-blue' },
  premium: { label: '프리미엄 (고가순)', orderBy: { price: 'desc' } as const, color: 'bg-neo-pink' },
} as const;

type Criterion = keyof typeof CRITERIA;

export async function generateStaticParams() {
  return (Object.keys(CRITERIA) as Criterion[]).map((criterion) => ({ criterion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ criterion: string }>;
}): Promise<Metadata> {
  const { criterion } = await params;
  if (!(criterion in CRITERIA)) return { title: 'Not Found' };
  const { label } = CRITERIA[criterion as Criterion];
  return {
    title: `노트북 랭킹 - ${label} | Super Blog`,
    description: `${label} 기준 노트북 랭킹 TOP 20`,
  };
}

export default async function RankPage({ params }: { params: Promise<{ criterion: string }> }) {
  const { criterion } = await params;
  if (!(criterion in CRITERIA)) notFound();

  const { label, orderBy, color } = CRITERIA[criterion as Criterion];

  const products = await prisma.product.findMany({
    orderBy,
    take: 20,
    select: {
      slug: true,
      maker: true,
      model: true,
      price: true,
      weight: true,
      imageUrl: true,
      categoryId: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className={`text-4xl font-black text-black inline-block px-4 py-2 border-4 border-black shadow-hard ${color} mb-4`}>
          노트북 랭킹
        </h1>
        <p className="text-xl font-black text-black">{label}</p>
      </div>

      {/* criterion 탭 */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {(Object.entries(CRITERIA) as [Criterion, (typeof CRITERIA)[Criterion]][]).map(([key, val]) => (
          <Link
            key={key}
            href={`/laptop/rank/${key}`}
            className={`px-4 py-2 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg transition-all ${key === criterion ? val.color : 'bg-white'}`}
          >
            {val.label}
          </Link>
        ))}
      </div>

      <ol className="space-y-4">
        {products.map((p, i) => (
          <li key={p.slug}>
            <Link
              href={`/${p.categoryId}/${p.slug}`}
              className="flex items-center gap-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg transition-all p-4"
            >
              <span className={`text-2xl font-black w-10 h-10 flex items-center justify-center border-4 border-black ${i < 3 ? 'bg-neo-yellow' : 'bg-white'}`}>
                {i + 1}
              </span>
              {p.imageUrl && (
                <img src={p.imageUrl} alt={`${p.maker} ${p.model}`} className="w-16 h-16 object-contain" />
              )}
              <div className="flex-1">
                <p className="font-black text-black text-lg">{p.maker} {p.model}</p>
                <p className="font-bold text-black">{p.price.toLocaleString()}원 · {p.weight}kg</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

**Step 2: 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add src/app/laptop/rank/
git commit -m "feat(pages): add /laptop/rank/[criterion] ranking page"
```

---

## Task 9: 가이드 페이지

**Files:**
- Create: `src/app/guide/[slug]/page.tsx`
- Create: `src/app/guide/[slug]/gaming-laptop-guide.tsx` (콘텐츠 컴포넌트)

**Step 1: 가이드 콘텐츠 컴포넌트 작성**

```tsx
// src/app/guide/[slug]/gaming-laptop-guide.tsx
export default function GamingLaptopGuide() {
  return (
    <article className="prose max-w-none space-y-8">
      <section className="bg-neo-pink border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-4">게이밍 노트북이란?</h2>
        <p className="font-bold text-black text-lg leading-relaxed">
          게이밍 노트북은 고성능 GPU와 CPU를 탑재하여 최신 게임을 원활하게 구동할 수 있는 노트북입니다.
          일반 노트북 대비 높은 발열과 소비전력을 가지지만, 그래픽 집약적인 작업에서 압도적인 성능을 발휘합니다.
        </p>
      </section>

      <section className="bg-white border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-6">핵심 스펙 체크리스트</h2>
        <div className="space-y-4">
          {[
            { spec: 'GPU', desc: 'RTX 4060 이상 권장. 게임 FPS에 가장 큰 영향을 줍니다.', color: 'bg-neo-yellow' },
            { spec: 'CPU', desc: 'Intel Core i7 / AMD Ryzen 7 이상. 멀티태스킹과 스트리밍에 영향.', color: 'bg-neo-green' },
            { spec: 'RAM', desc: '16GB 최소, 32GB 권장. 최신 AAA 타이틀은 16GB+ 필요.', color: 'bg-neo-blue' },
            { spec: '디스플레이', desc: '144Hz 이상 고주사율. FPS 게임에서 체감 차이가 큽니다.', color: 'bg-neo-orange' },
            { spec: '냉각', desc: '듀얼 팬 이상. 장시간 게임 시 성능 유지에 필수.', color: 'bg-neo-pink' },
          ].map(({ spec, desc, color }) => (
            <div key={spec} className={`flex gap-4 items-start p-4 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${color}`}>
              <span className="font-black text-black text-lg w-24 shrink-0">{spec}</span>
              <span className="font-bold text-black">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neo-green border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-4">예산별 추천 전략</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { budget: '100만원대', gpu: 'RTX 4060', tip: '1080p 고주사율 게임에 최적' },
            { budget: '150만원대', gpu: 'RTX 4070', tip: '1440p 게임과 창작 작업 병행' },
            { budget: '200만원+', gpu: 'RTX 4080/4090', tip: '4K 게임 및 전문 그래픽 작업' },
          ].map(({ budget, gpu, tip }) => (
            <div key={budget} className="bg-white border-4 border-black p-4">
              <p className="font-black text-black text-xl mb-2">{budget}</p>
              <p className="font-black text-neo-pink mb-1">{gpu}</p>
              <p className="font-bold text-black text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
```

**Step 2: 가이드 페이지 라우트 작성**

```tsx
// src/app/guide/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GamingLaptopGuide from './gaming-laptop-guide';

const GUIDES: Record<string, { title: string; description: string; component: React.ComponentType }> = {
  'gaming-laptop-guide': {
    title: '게이밍 노트북 완벽 가이드 2026 | Super Blog',
    description: 'GPU, CPU, 디스플레이까지 게이밍 노트북 선택의 모든 것을 알려드립니다.',
    component: GamingLaptopGuide,
  },
};

export async function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return { title: 'Not Found' };
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) notFound();

  const GuideContent = guide.component;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-orange inline-block px-4 py-2 border-4 border-black shadow-hard">
        {guide.title.split('|')[0].trim()}
      </h1>
      <GuideContent />
    </div>
  );
}
```

**Step 3: 빌드 확인**

```bash
npx tsc --noEmit && npm run build
```

Expected: 오류 없음

**Step 4: 커밋**

```bash
git add src/app/guide/
git commit -m "feat(pages): add /guide/[slug] guide page with gaming laptop guide"
```

---

## 완료 검증

```bash
# 전체 테스트
npx jest

# 빌드
npm run build

# 수동 확인 (dev 서버)
npm run dev
```

확인 항목:
- [ ] `/sitemap.xml` — 제품/카테고리 URL 포함
- [ ] `/robots.txt` — sitemap 링크 포함
- [ ] 제품 상세 페이지 소스 — `application/ld+json` 존재
- [ ] Header 검색 input → 타이핑 시 드롭다운 출력
- [ ] 모바일 너비에서 햄버거 → 드로어 메뉴 동작
- [ ] `/terms`, `/privacy` 페이지 정상 렌더
- [ ] `/laptop/rank/price` — 제품 목록 가격순 출력
- [ ] `/guide/gaming-laptop-guide` — 가이드 페이지 정상 렌더
- [ ] BuyButtonCTA 클릭 → EventLog DB INSERT (dev 서버에서 Prisma Studio로 확인)
