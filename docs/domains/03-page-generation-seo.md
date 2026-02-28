# 03. 페이지 생성 & SEO (Page Generation & SEO)

## 목적

제품 DB + AI 콘텐츠를 기반으로 Next.js 정적 페이지를 자동 생성하고,
검색엔진 최적화로 구매 의도 트래픽을 확보한다.

---

## 페이지 생성 전략

### SSG vs ISR

| 페이지 | 생성 방식 | 재생성 주기 | 이유 |
|--------|----------|-----------|------|
| 카테고리 메인 | ISR | 1일 | 신규 제품 반영 |
| 서브카테고리 | ISR | 1일 | 제품 목록 갱신 |
| 제품 상세 | SSG + ISR | 1일 | 가격 변동 반영 |
| 1:1 비교 | SSG | 7일 | 스펙 변경 시만 갱신 |
| 랭킹 | ISR | 1일 | 가격/순위 변동 반영 |
| 구매 가이드 | SSG | 수동 | 콘텐츠 업데이트 시만 |
| 할인/특가 | ISR | 1시간 | 실시간성 필요 |

### 동적 페이지 생성

```
제품 200개 등록 시 자동 생성되는 페이지:

제품 상세:        200페이지
1:1 비교:         ~500페이지 (인기 조합 자동 선별)
랭킹:             ~20페이지 (주요 스펙 기준)
서브카테고리:      ~10페이지
구매 가이드:       ~5페이지
─────────────────────────
총:               ~735페이지
```

### 비교 페이지 자동 생성 규칙

모든 조합(N×N)을 만들면 페이지가 폭발하므로 선별:

```
비교 페이지 생성 조건 (OR):
1. 검색 데이터에서 "A vs B" 검색량이 100+/월
2. 같은 서브카테고리 + 가격 차이 30% 이내
3. 같은 브랜드 내 상위/하위 라인업
4. 사이트 내부 검색에서 자주 비교되는 조합
```

---

## SEO 전략

### 키워드 구조

```
Tier 1 (경쟁 높음, 장기 목표):
  "노트북 추천" "게이밍 노트북 추천 2026"

Tier 2 (경쟁 중간, 주력):
  "가성비 게이밍 노트북" "대학생 노트북 추천"
  "맥북 프로 vs 갤럭시북 프로"

Tier 3 (경쟁 낮음, 빠른 성과):
  "ASUS ROG Strix G16 스펙" "레노버 리전 프로 7 후기"
  "배터리 오래가는 노트북 순위"
```

**전략**: Tier 3부터 상위 노출 → 사이트 권위 축적 → Tier 2 → Tier 1

### 페이지별 SEO 설정

| 페이지 | title 패턴 | description 패턴 | Open Graph (OG) 이미지 |
|--------|-----------|-----------------|------------------------|
| 카테고리 | "노트북 추천 TOP {N}가지 ({year})" | "{year}년 {category} 추천 제품을 비교 분석했습니다" | 카테고리 대표 이미지 |
| 서브카테고리 | "{subcategory} 추천 BEST {N} ({year})" | "전문가가 선정한 {subcategory} {N}개를 비교합니다" | 서브카테고리 대표 제품 모음 이미지 |
| 제품 상세 | "{product} 스펙 및 리뷰 - 장단점 분석" | "{product}의 상세 스펙과 장단점을 분석합니다" | 제품 고화질 이미지 |
| 1:1 비교 | "{A} vs {B} 비교 - 어떤 게 나을까?" | "{A}와 {B}를 스펙, 가격, 성능 기준으로 비교합니다" | **@vercel/og (Satori)**: A/B 제품 이미지 병합 동적 생성 |
| 랭킹 | "{criterion} 좋은 노트북 TOP {N}" | "{criterion} 기준 노트북 순위를 정리했습니다" | 순위권 제품 동적 썸네일 |
| 구매 가이드 | "{topic} - 완벽 가이드 ({year})" | "{topic}에 대해 알아야 할 모든 것을 정리했습니다" | 가이드 관련 요약 다이어그램 |

### Schema.org 구조화 데이터

**제품 페이지**:
```json
{
  "@type": "Product",
  "name": "ASUS ROG Strix G16 (2026)",
  "brand": { "@type": "Brand", "name": "ASUS" },
  "offers": {
    "@type": "Offer",
    "price": "1590000",
    "priceCurrency": "KRW",
    "availability": "InStock",
    "url": "쿠팡 링크"
  },
  "review": {
    "@type": "Review",
    "author": { "@type": "Organization", "name": "사이트명" },
    "reviewBody": "AI 생성 리뷰 요약"
  }
}
```

**비교 페이지**:
```json
{
  "@type": "Article",
  "headline": "맥북 프로 vs 갤럭시북 프로 비교",
  "about": [
    { "@type": "Product", "name": "맥북 프로" },
    { "@type": "Product", "name": "갤럭시북 프로" }
  ]
}
```

**모든 페이지**:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "name": "홈", "item": "/" },
    { "name": "노트북", "item": "/notebook/" },
    { "name": "게이밍", "item": "/notebook/gaming/" }
  ]
}
```

### 내부 링크 전략

```
구매 가이드 (SEO 유입)
  → 서브카테고리 (제품 목록)
    → 제품 상세 (전환)
    → 비교 페이지 (전환)

제품 상세
  → 관련 비교 페이지 ("이 제품과 비교해보세요")
  → 같은 카테고리 다른 제품

비교 페이지
  → 양쪽 제품 상세 페이지
  → 관련 구매 가이드
```

### 사이트맵

```
next-sitemap 활용:

sitemap-products.xml — 제품 상세 (daily)
sitemap-compare.xml — 비교 페이지 (weekly)
sitemap-guides.xml — 구매 가이드 (monthly)
sitemap-categories.xml — 카테고리/서브카테고리 (weekly)
```

---

## 성능 최적화

| 성능 | 내용 |
|------|------|
| 이미지 | next/image 자동 최적화 (WebP, lazy loading) |
| 폰트 | next/font (FOUT 방지) |
| CSS | Tailwind purge (사용하지 않는 스타일 제거) |
| JS 번들 | 동적 import, 필터/정렬은 클라이언트 컴포넌트로 분리 |
| 캐싱 | ISR revalidate + CDN (Vercel Edge), **대규모 ISR 갱신 시 DB 부하 방지를 위한 캐시 레이어 (Redis 등) 고려** |

---

## 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 비교 페이지 폭발적 증가 | 생성 규칙으로 선별, 검색량 기반 우선순위 |
| SEO 중복 콘텐츠 판정 | 페이지마다 고유 분석, canonical URL 설정 |
| Core Web Vitals 저하 | SSG 우선, 이미지 최적화, JS 최소화 |
| 구글 인덱싱 지연 | Search Console 수동 제출, 사이트맵 자동 갱신 |
