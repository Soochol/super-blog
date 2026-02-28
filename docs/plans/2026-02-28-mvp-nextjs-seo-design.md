# Super Blog MVP 설계 분석 및 구조 (Next.js + SEO 중심)

## 1. 목적 및 범위
이 프로젝트는 "Super Blog" 비교 플랫폼의 핵심인 **Frontend(Next.js) 구조와 SEO 정적 생성(SSG/ISR) 로직**을 검증하는 MVP(Minimum Viable Product)입니다. 
당장 백엔드(Supabase, 크롤러, AI 파이프라인)를 구축하기 전, 하드코딩된 더미 데이터를 활용하여 사이트의 골격과 라우팅 시스템이 검색 엔진에 최적화된 형태로 작동하는지 확인합니다.

## 2. 데이터 스키마 및 파일 구조 설계
백엔드 DB 테이블과 1:1로 매칭될 JSON 더미 데이터를 기반으로 동작합니다.

### 2.1 데이터 소스 (`src/data/*.json`)
- **`categories.json`**: 카테고리 정보 (`id`, `name` 등)
- **`products.json`**: 제품 기본 정보 및 스펙 (`id`, `categoryId`, `name`, `price`, `specs` 객체)
- **`reviews.json`**: AI 생성 결과물 목업 (`productId`, `summary`, `pros`, `cons` 등)

### 2.2 디렉터리 구조 (`src/` 중심)
추후 백엔드 파이프라인 개발 시 DDD (Domain-Driven Design) 로의 전환을 고려하여, 프론트엔드 레벨에서도 도메인(Feature)별 폴더 분리를 가볍게 적용합니다.

```
src/
├── app/               # Next.js App Router (페이지 라우팅)
├── data/              # 더미 JSON 보관소
├── lib/
│   └── api/           # 더미 데이터를 불러오는 유틸 함수 (추후 DB Fetch 함수로 교체)
├── domains/           # 도메인별 컴포넌트 및 로직 분리 (FSD/DDD 예비 단계)
│   ├── product/       # 제품 데이터 관련 UI (카드, 스펙표 등)
│   ├── content/       # 콘텐츠(리뷰, 가이드) 관련 UI
│   └── monetization/  # 쿠팡 파트너스 CTA 컴포넌트 등
└── types/             # TypeScript 인터페이스 (Product, Review 등)
```

## 3. 라우팅 (Routing) 전략
Next.js App Router를 사용하여 정적 생성(SSG)이 가능한 동적 라우트를 구축합니다. 모든 URL 파라미터는 빌드 타임에 `generateStaticParams()`를 통해 사전에 렌더링됩니다.

### 3.1 핵심 페이지 구조
- **홈페이지 (`/`)**: 
  - `app/page.tsx`
  - 인기 카테고리 및 최신 제품(더미) 하드코딩 노출
- **카테고리 메인 (`/[categoryId]`)**:
  - `app/[categoryId]/page.tsx` (예: `/laptop`)
  - 해당 카테고리에 속한 제품 목록 렌더링
- **제품 상세 (`/[categoryId]/[productId]`)**:
  - `app/[categoryId]/[productId]/page.tsx` (예: `/laptop/macbook-pro-16`)
  - 특정 제품의 정보, 스펙 테이블, 장단점(리뷰) 표시
- **1:1 비교 (`/[categoryId]/compare/[ids]`)**:
  - `app/[categoryId]/compare/[ids]/page.tsx` (예: `/laptop/compare/macbook-pro-16-vs-galaxy-book-4`)
  - `[ids]`를 `-vs-` 기준으로 파싱하여 두 제품의 스펙 목록을 대조하는 페이지

### 3.2 렌더링 및 SEO 검증
- 위 동적 라우트들은 빌드 시점에 더미 JSON을 순회하며 HTML로 생성 (SSG).
- 각 페이지에 제품 및 비교 조합에 맞는 동적 `generateMetadata()` 구현을 통한 SEO 최적화 메타태그(Title, Description) 적용 검증.

## 4. UI 레이아웃 및 컴포넌트 구조
디자인은 화려함보다는 쿠팡 파트너스 링크 클릭(CTA) 유도와 가독성에 초점을 둔 깔끔한 블록 기반(Tailwind CSS) 레이아웃을 사용합니다.

### 4.1 글로벌 레이아웃 (`app/layout.tsx`)
- **Header**: 로고, GNB(Global Navigation Bar) 및 더미 형태의 검색창
- **Footer**: 회사 정보 및 쿠팡 파트너스 면책 조항 ("이 포스팅은 쿠팡 파트너스 활동의 일환으로...")

### 4.2 도메인별 핵심 컴포넌트 (`src/domains/*`)
- **`domains/product/ProductCard`**: 제품 목록에 쓰이는 공용 카드. 제품 이미지, 별점, 스펙 하이라이트 제공.
- **`domains/product/ProductSpecTable`**: 상세 페이지 및 비교 페이지에서 사용되는 상세 스펙 비교 테이블.
- **`domains/monetization/BuyButtonCTA`**: 최적화 전환율의 핵심. 파란색/주황색 등 눈에 띄는 디자인의 쿠팡 구매 버튼. (클릭 트래킹 이벤트 부착 준비 포함).

## 5. 다음 단계
1. Next.js 프로젝트 설정 및 Tailwind CSS 구성
2. 더미 JSON 데이터 파일(`categories.json`, `products.json`, `reviews.json`) 작성
3. `src/domains/` 구조 배포 및 기본 컴포넌트(`ProductCard`, `BuyButtonCTA` 등) 구현
4. 라우팅 시스템(`app/`) 및 `generateStaticParams()`, 메타데이터 설정 완료
5. Vercel 테스트 배포 및 SEO/접근성 검증
