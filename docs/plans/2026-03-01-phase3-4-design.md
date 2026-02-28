# Phase 3 & 4 설계: 수익화·운영·프론트엔드 확장

## 범위

- **3.1** 클릭 추적 (`PrismaAnalyticsTracker`)
- **3.2** SEO 자동화 (sitemap, robots.txt, JSON-LD)
- **4.1** 검색 기능, 모바일 메뉴, `/terms` `/privacy` 페이지
- **4.2** 랭킹 페이지, 가이드 페이지

---

## 3.1 클릭 추적

### 아키텍처

`BuyButtonCTA`는 클라이언트 컴포넌트라 Prisma를 직접 호출할 수 없음. Next.js Server Action으로 처리.

```
BuyButtonCTA (client)
  onClick → trackCtaClick(serverAction)
    → PrismaAnalyticsTracker.trackEvent()
      → EventLog INSERT
```

### 구현 파일

| 파일 | 역할 |
|---|---|
| `src/infrastructure/analytics/PrismaAnalyticsTracker.ts` | `AnalyticsTracker` 포트 구현체. `EventLog` 테이블에 INSERT |
| `src/app/actions/analytics.ts` | Server Action `trackCtaClick(productId, pageType, ctaPosition, ctaVariant)` |
| `src/components/monetization/BuyButtonCTA.tsx` | `productId`, `pageType`, `ctaPosition` props 추가, onClick에 Server Action 연결 |

### 데이터 모델

기존 Prisma `EventLog` 테이블 그대로 사용:
```
eventName: "cta_click"
payload: { product_id, page_type, cta_position, cta_variant }
timestamp: now()
```

---

## 3.2 SEO 자동화

### sitemap.xml

`src/app/sitemap.ts` — Next.js `MetadataRoute.Sitemap` 방식:
- 카테고리 라우트 (`/[categoryId]`)
- 제품 상세 라우트 (`/[categoryId]/[productId]`)
- 비교 라우트는 조합이 너무 많아 제외

### robots.txt

`src/app/robots.ts` — `MetadataRoute.Robots`:
- `Allow: /`
- `Sitemap: https://[domain]/sitemap.xml`

### JSON-LD

제품 상세 페이지 (`[productId]/page.tsx`)에 `Product` 스키마 삽입:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "offers": { "@type": "Offer", "price": "...", "priceCurrency": "KRW" }
}
```

비교 페이지 (`compare/page.tsx`)에 `Review` 스키마 삽입.

---

## 4.1 프론트엔드 즉시 수정

### 검색 기능

- `src/app/api/search/route.ts` — `GET /api/search?q=`
  - `prisma.product.findMany({ where: { OR: [maker, model 포함] } })`
  - 결과: `{ id, name, categoryId, imageUrl }[]`
- Header input: 디바운스(300ms) + 결과 드롭다운 표시
- Header를 `'use client'`로 전환하여 상태 관리

### 모바일 메뉴

- Header에 `useState(isMenuOpen)` 추가
- 햄버거 버튼 클릭 → 오버레이 드로어 슬라이드 (기존 네오브루탈리즘 스타일 유지)
- 메뉴 항목: 노트북 리뷰, 랭킹, 가이드

### 누락 페이지

- `src/app/terms/page.tsx` — 이용약관 정적 텍스트
- `src/app/privacy/page.tsx` — 개인정보처리방침 정적 텍스트

---

## 4.2 새 페이지

### 랭킹 페이지 `/laptop/rank/[criterion]`

criterion 종류:

| criterion | 정렬 기준 |
|---|---|
| `price` | 가격 오름차순 (가성비) |
| `performance` | 추후 성능 점수 필드 추가 시까지 CPU 기준 텍스트 정렬 |
| `weight` | 무게 오름차순 (휴대성) |

- `src/app/laptop/rank/[criterion]/page.tsx`
- `generateStaticParams`로 3개 criterion 정적 생성
- Prisma 쿼리로 DB에서 정렬된 제품 목록 조회

### 가이드 페이지 `/guide/[slug]`

- 초기엔 MDX 파일 기반 (`src/content/guides/[slug].mdx`)
- `src/app/guide/[slug]/page.tsx`
- `generateStaticParams`로 파일 목록에서 slug 생성
- 첫 가이드: `gaming-laptop-guide.mdx` (게이밍 노트북 가이드)

---

## 구현 순서

1. 3.1 클릭 추적 (PrismaAnalyticsTracker + Server Action + BuyButtonCTA 연결)
2. 3.2 SEO (sitemap.ts + robots.ts + JSON-LD)
3. 4.1 검색 API + Header 연결
4. 4.1 모바일 메뉴
5. 4.1 terms/privacy 페이지
6. 4.2 랭킹 페이지
7. 4.2 가이드 페이지
