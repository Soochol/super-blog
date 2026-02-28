# 가전제품 비교 사이트 + 쿠팡파트너스 수익화

## 1. 프로젝트 개요

### 목적

가전제품(노트북 시작) 비교 전문 사이트를 구축하고, 쿠팡파트너스 제휴 링크로 수익화한다.
AI가 제조사 홈페이지에서 제품 데이터를 크롤링하고, 비교 분석/구매 가이드 콘텐츠를 자동 생성한다.

### 왜 블로그가 아닌 비교 사이트인가

| 블로그 | 비교 사이트 |
|--------|-----------|
| 글 1개 = 키워드 1개 = 수익 기회 1개 | 제품 1개 추가 → 비교 페이지 N개 자동 생성 |
| AI 탐지/저품질 판정 리스크 | 데이터 기반 사이트 → AI 탐지 이슈 없음 |
| 글마다 수동 작업 | 제품 DB 기반 자동 확장 |
| 도메인 권위 느리게 축적 | 전문 사이트로 빠른 권위 축적 |

### 레퍼런스

- **toptip.co.kr** — WordPress 기반 가전 비교 콘텐츠 사이트 (쿠팡파트너스)
- 우리의 차별점: 제품 DB 기반 자동 페이지 생성, 실시간 가격, 스펙 필터/정렬

### 핵심 지표

| 지표 | 목표 |
|------|------|
| 초기 카테고리 | 노트북 (게이밍/사무용/학생용/가성비) |
| 제품 수 (6개월) | 200+ |
| 월간 페이지 | 500+ (제품 + 비교 + 가이드) |
| 월 수익 목표 (6개월) | 50~200만원 |
| 월 수익 목표 (12개월) | 200~500만원 |

---

## 2. 수익 모델

### 쿠팡파트너스 (메인 수익 — 목표 80%)

```
방문자 → 제품 페이지/비교 페이지 → "쿠팡 최저가 확인" 클릭
→ 24시간 쿠키 → 구매 발생 → 수수료 3%

노트북 평균 80만원 × 3% = 건당 24,000원
월 50건 전환 = 120만원
```

**CTA 전략**:
- 상단 빠른비교 테이블: 각 제품에 "최저가 보기" 버튼
- 개별 제품 페이지: "쿠팡에서 가격 확인" 버튼
- 비교 페이지: 양쪽 제품 모두 링크
- 구매 가이드 하단: 추천 제품 링크

### 구글 애드센스 (보조 수익 — 목표 20%)

- 구매 가이드, 선택법 등 정보성 페이지에 배치
- 제품/비교 페이지에서는 CTA와 충돌하지 않게 최소 배치

---

## 3. 사이트 구조

```
비교왕 (gageon.kr 예시)
│
├── / (홈)
│     인기 카테고리 + 최근 리뷰 + 오늘의 추천
│
├── /notebook/ (카테고리 메인)
│     서브카테고리 목록 + 인기 제품 + 필터
│
├── /notebook/gaming/ (서브카테고리)
│     게이밍 노트북 추천 가이드 + 제품 목록 + 필터/정렬
│
├── /notebook/p/{slug}/ (개별 제품)
│     스펙표 + AI 리뷰 (장단점/추천 대상) + 가격 + 쿠팡 링크
│
├── /notebook/compare/{a}-vs-{b}/ (1:1 비교)
│     나란히 스펙 비교 + AI 분석 + 양쪽 쿠팡 링크
│
├── /notebook/rank/{criterion}/ (스펙 기준 랭킹)
│     예: /notebook/rank/battery-life/ → 배터리 순 정렬
│
├── /guide/{slug}/ (구매 가이드)
│     "노트북 고르는 법", "CPU 비교 가이드" 등 (SEO 유입용)
│
└── /deal/ (할인/특가)
      가격 하락 감지 → 할인 정보 자동 게시
```

### 페이지별 역할

| 페이지 | SEO 키워드 예시 | 수익 역할 |
|--------|---------------|----------|
| 카테고리 | "게이밍 노트북 추천" | 유입 → 제품 페이지로 유도 |
| 제품 상세 | "ASUS ROG Strix G16 스펙" | 쿠팡 링크 전환 |
| 1:1 비교 | "맥북 프로 vs 갤럭시북" | 쿠팡 링크 전환 (양쪽) |
| 랭킹 | "배터리 긴 노트북 순위" | 유입 → 제품 페이지 유도 |
| 구매 가이드 | "노트북 고르는 법 2026" | 애드센스 + 제품 페이지 유도 |
| 할인 | "노트북 할인 특가" | 즉시 전환 (긴급성) |

---

## 4. 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|----------|
| **프론트엔드** | Next.js 15 (App Router) | SSG/ISR로 SEO 최적화 + 빠른 로딩 |
| **스타일링** | Tailwind CSS + shadcn/ui | 빠른 개발, 반응형, 일관된 디자인 |
| **DB** | Supabase (셀프호스팅) | PostgreSQL + REST API + Storage 올인원 |
| **데이터 수집** | Python + Playwright + AI | 제조사 사이트 크롤링 + AI 정확성 검증 |
| **AI** | Claude API | 제품 설명, 비교 분석, 구매 가이드 생성 |
| **이미지** | 제조사 공식 이미지 | AI 생성 불필요 — 실제 제품 사진 사용 |
| **배포** | Vercel | Next.js 최적 호스팅, 자동 ISR |
| **분석** | Google Analytics + Search Console | 트래픽/SEO/전환 추적 |

### 아키텍처

```
[Python 데이터 엔진]                    [Next.js 사이트]
│                                        │
├── 제조사 크롤링 (Playwright)            ├── SSG 빌드 (제품/비교 페이지)
├── AI 정확성 검증 (Claude)              ├── ISR 갱신 (가격 변동 시)
├── 쿠팡 API (가격/링크)                 ├── 클라이언트: 필터/정렬/검색
├── AI 콘텐츠 생성 (리뷰/비교/가이드)     └── CTA → 쿠팡파트너스 링크
│
└──→ Supabase DB ←──────────────────────┘
      (products, specs, prices, content)
```

---

## 5. 데이터베이스 스키마

### categories — 카테고리 (확장 가능)
```sql
CREATE TABLE categories (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,              -- "노트북"
    slug            TEXT NOT NULL UNIQUE,        -- "notebook"
    parent_id       UUID REFERENCES categories(id), -- 상위 카테고리 (NULL이면 최상위)
    description     TEXT,
    icon            TEXT,                        -- 아이콘 이름
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### subcategories — 서브카테고리
```sql
CREATE TABLE subcategories (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id     UUID REFERENCES categories(id) NOT NULL,
    name            TEXT NOT NULL,              -- "게이밍 노트북"
    slug            TEXT NOT NULL,              -- "gaming"
    description     TEXT,
    filter_criteria JSONB DEFAULT '{}',         -- 이 서브카테고리의 자동 필터 조건
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category_id, slug)
);
```

### brands — 브랜드
```sql
CREATE TABLE brands (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,              -- "ASUS"
    slug            TEXT NOT NULL UNIQUE,        -- "asus"
    logo_url        TEXT,
    website_url     TEXT,                        -- 크롤링 대상 URL
    crawl_config    JSONB DEFAULT '{}',         -- 크롤링 설정 (셀렉터 등)
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### products — 제품
```sql
CREATE TABLE products (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id     UUID REFERENCES categories(id) NOT NULL,
    brand_id        UUID REFERENCES brands(id) NOT NULL,
    name            TEXT NOT NULL,              -- "ASUS ROG Strix G16 (2026)"
    slug            TEXT NOT NULL UNIQUE,        -- "asus-rog-strix-g16-2026"
    model_number    TEXT,                        -- "G614JU"
    summary         TEXT,                        -- 한 줄 요약
    image_url       TEXT,                        -- 대표 이미지
    images          JSONB DEFAULT '[]',         -- 추가 이미지 URL 배열
    source_url      TEXT,                        -- 제조사 페이지 URL (크롤링 출처)
    is_active       BOOLEAN DEFAULT true,
    is_featured     BOOLEAN DEFAULT false,      -- 추천 제품 여부
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### product_specs — 제품 스펙 (유연한 KV 구조)
```sql
CREATE TABLE product_specs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id      UUID REFERENCES products(id) NOT NULL,
    spec_key        TEXT NOT NULL,              -- "cpu", "ram", "storage", "gpu", "display_size"
    spec_value      TEXT NOT NULL,              -- "Intel Core i7-14700HX"
    spec_unit       TEXT,                        -- "GB", "인치", "Wh" 등
    numeric_value   FLOAT,                      -- 정렬/필터용 숫자 값 (16, 15.6, 90 등)
    display_order   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, spec_key)
);
```

### spec_definitions — 스펙 항목 정의 (카테고리별)
```sql
CREATE TABLE spec_definitions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id     UUID REFERENCES categories(id) NOT NULL,
    spec_key        TEXT NOT NULL,              -- "cpu"
    display_name    TEXT NOT NULL,              -- "프로세서"
    spec_type       TEXT NOT NULL DEFAULT 'text', -- "text" / "number" / "boolean"
    unit            TEXT,                        -- "GB", "인치"
    is_filterable   BOOLEAN DEFAULT false,      -- 필터 UI에 노출 여부
    is_comparable   BOOLEAN DEFAULT true,       -- 비교표에 포함 여부
    display_order   INTEGER DEFAULT 0,
    UNIQUE(category_id, spec_key)
);
```

### prices — 가격 이력
```sql
CREATE TABLE prices (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id      UUID REFERENCES products(id) NOT NULL,
    price           INTEGER NOT NULL,           -- 원 단위
    original_price  INTEGER,                    -- 정가 (할인 전)
    source          TEXT NOT NULL DEFAULT 'coupang', -- "coupang"
    affiliate_url   TEXT,                        -- 쿠팡파트너스 링크
    is_available    BOOLEAN DEFAULT true,
    checked_at      TIMESTAMPTZ DEFAULT now()
);
```

### ai_content — AI 생성 콘텐츠
```sql
CREATE TABLE ai_content (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type    TEXT NOT NULL,              -- "product_review" / "comparison" / "buying_guide" / "subcategory_intro"
    reference_type  TEXT NOT NULL,              -- "product" / "product_pair" / "subcategory" / "category"
    reference_id    TEXT NOT NULL,              -- 제품 ID, "id1:id2" (비교), 서브카테고리 ID 등
    title           TEXT,
    body            TEXT NOT NULL,              -- AI 생성 콘텐츠 (HTML/Markdown)
    meta_description TEXT,
    ai_model        TEXT NOT NULL,              -- "claude-sonnet-4-6"
    prompt_hash     TEXT,                        -- 프롬프트 해시 (변경 감지용)
    quality_score   FLOAT,                      -- 자체 품질 점수
    status          TEXT DEFAULT 'draft',       -- "draft" / "published" / "outdated"
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### analytics — 성과 추적
```sql
CREATE TABLE analytics (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path       TEXT NOT NULL,              -- "/notebook/p/asus-rog-strix-g16"
    date            DATE NOT NULL,
    views           INTEGER DEFAULT 0,
    clicks          INTEGER DEFAULT 0,          -- 쿠팡 링크 클릭 수
    ctr             FLOAT DEFAULT 0,            -- 클릭률
    revenue         INTEGER DEFAULT 0,          -- 수익 (원)
    search_keywords JSONB DEFAULT '[]',         -- 유입 검색어
    UNIQUE(page_path, date)
);
```

### crawl_logs — 크롤링 이력
```sql
CREATE TABLE crawl_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id        UUID REFERENCES brands(id),
    job_type        TEXT NOT NULL,              -- "spec_crawl" / "price_check" / "new_product"
    status          TEXT NOT NULL,              -- "started" / "completed" / "failed"
    items_processed INTEGER DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
```

### ERD

```
categories ──1:N──→ subcategories
     │
     ├──1:N──→ products ──1:N──→ product_specs
     │              │
     │              ├──1:N──→ prices
     │              │
     │              └──via ai_content──→ AI 생성 콘텐츠
     │
     └──1:N──→ spec_definitions

brands ──1:N──→ products

analytics (독립 — page_path 기반)
crawl_logs (독립 — 배치 작업 기록)
```

### 인덱스

```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_specs_product ON product_specs(product_id);
CREATE INDEX idx_product_specs_key ON product_specs(spec_key);
CREATE INDEX idx_product_specs_numeric ON product_specs(spec_key, numeric_value);
CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_checked ON prices(checked_at DESC);
CREATE INDEX idx_ai_content_ref ON ai_content(reference_type, reference_id);
CREATE INDEX idx_ai_content_type ON ai_content(content_type);
CREATE INDEX idx_analytics_path_date ON analytics(page_path, date);
```

---

## 6. 파이프라인

### 데이터 수집 파이프라인 (Python)

```
[매일 06:00] 신규 제품 크롤링
  → 제조사 사이트 크롤링 (Playwright)
  → AI가 스펙 추출 + 정확성 검증 (Claude)
  → products + product_specs 테이블 저장

[매일 08:00] 가격 업데이트
  → 쿠팡 API/크롤링으로 최신 가격 수집
  → 쿠팡파트너스 링크 생성
  → prices 테이블 저장
  → 가격 하락 감지 → deal 콘텐츠 생성

[매일 09:00] AI 콘텐츠 생성/갱신
  → 신규 제품: 리뷰 콘텐츠 생성
  → 신규 비교 조합: 비교 분석 생성
  → 변경된 제품: 콘텐츠 업데이트
  → ai_content 테이블 저장

[매일 10:00] 사이트 빌드 트리거
  → Vercel 재빌드 (ISR 또는 webhook)
  → 새 페이지 자동 생성/갱신

[매일 23:00] 분석
  → Google Analytics/Search Console 데이터 수집
  → 쿠팡파트너스 수익 수집
  → analytics 테이블 저장
```

### AI 콘텐츠 생성 전략

| 콘텐츠 유형 | 생성 트리거 | AI 입력 | 출력 |
|------------|-----------|---------|------|
| 제품 리뷰 | 신규 제품 등록 | 스펙 데이터 + 카테고리 컨텍스트 | 장단점, 추천 대상, 한 줄 평 |
| 1:1 비교 | 같은 서브카테고리 제품 쌍 | 양쪽 스펙 + 가격 | 비교 분석, 승자 판정, 상황별 추천 |
| 구매 가이드 | 수동 요청 또는 주기적 | 카테고리 전체 제품 데이터 | 선택 기준, FAQ, 추천 제품 |
| 서브카테고리 소개 | 서브카테고리 생성/갱신 | 해당 서브카테고리 제품 목록 | 카테고리 설명, 트렌드, 추천 |

---

## 7. 프로젝트 디렉토리 구조

```
super-blog/
├── site/                          # Next.js 사이트
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                   # App Router
│   │   │   ├── page.tsx           # 홈
│   │   │   ├── [category]/
│   │   │   │   ├── page.tsx       # 카테고리 메인
│   │   │   │   ├── [subcategory]/
│   │   │   │   │   └── page.tsx   # 서브카테고리
│   │   │   │   ├── p/[slug]/
│   │   │   │   │   └── page.tsx   # 제품 상세
│   │   │   │   ├── compare/[slugs]/
│   │   │   │   │   └── page.tsx   # 1:1 비교
│   │   │   │   └── rank/[criterion]/
│   │   │   │       └── page.tsx   # 랭킹
│   │   │   ├── guide/[slug]/
│   │   │   │   └── page.tsx       # 구매 가이드
│   │   │   └── deal/
│   │   │       └── page.tsx       # 할인/특가
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui
│   │   │   ├── product/           # ProductCard, SpecTable, PriceTag
│   │   │   ├── compare/           # CompareTable, VsHeader
│   │   │   ├── filter/            # FilterSidebar, SortDropdown
│   │   │   └── layout/            # Header, Footer, Sidebar
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Supabase 클라이언트
│   │   │   └── coupang.ts         # 쿠팡 링크 유틸
│   │   └── types/
│   │       └── database.ts        # DB 타입 정의
│   └── public/
│
├── engine/                        # Python 데이터 엔진
│   ├── pyproject.toml
│   ├── src/
│   │   ├── crawler/               # 제조사 사이트 크롤링
│   │   │   ├── base.py            # 크롤러 공통 인터페이스
│   │   │   ├── asus.py            # ASUS 크롤러
│   │   │   ├── samsung.py         # 삼성 크롤러
│   │   │   ├── lg.py              # LG 크롤러
│   │   │   └── lenovo.py          # 레노버 크롤러
│   │   ├── ai/                    # AI 관련
│   │   │   ├── spec_extractor.py  # 크롤링 데이터에서 스펙 추출
│   │   │   ├── validator.py       # 스펙 정확성 검증
│   │   │   ├── reviewer.py        # 제품 리뷰 생성
│   │   │   ├── comparator.py      # 비교 분석 생성
│   │   │   └── guide_writer.py    # 구매 가이드 생성
│   │   ├── price/                 # 가격 추적
│   │   │   ├── coupang.py         # 쿠팡 가격/링크 수집
│   │   │   └── tracker.py         # 가격 변동 감지
│   │   ├── pipeline/              # 파이프라인 오케스트레이션
│   │   │   ├── scheduler.py       # APScheduler 작업 정의
│   │   │   └── jobs.py            # 개별 배치 작업
│   │   └── common/
│   │       ├── config.py          # 설정 (.env)
│   │       ├── database.py        # Supabase 클라이언트
│   │       └── logger.py          # 로깅
│   └── tests/
│
├── docker/
│   ├── docker-compose.yml         # Supabase 셀프호스팅
│   └── Dockerfile                 # Python 엔진
│
├── migrations/
│   └── 001_initial.sql            # 초기 스키마
│
└── docs/
    ├── plans/                     # 설계 문서
    └── domains/                   # 도메인별 상세 문서
```

---

## 8. 비용 예측

### 월간 비용 (운영 기준)

| 항목 | 비용 | 비고 |
|------|------|------|
| Vercel (호스팅) | 무료~$20 | Hobby 무료, Pro $20/월 |
| Supabase (셀프호스팅) | $5~10 | VPS 비용만 |
| Claude API | $30~50 | 리뷰/비교 생성 (제품 200개 기준) |
| 도메인 | ~$1 | 연간 $12 |
| **월 합계** | **$36~81 (약 5~12만원)** | |

기존 블로그 자동화 대비 **70~80% 비용 절감** (AI 대량 글 생성 불필요)

### 수익 예측

| 기간 | 월 방문자 | 전환 건수 | 예상 수익 |
|------|----------|----------|----------|
| 1~3개월 | 1,000 | 5~10건 | 12~24만원 |
| 3~6개월 | 5,000 | 25~50건 | 60~120만원 |
| 6~12개월 | 15,000 | 75~150건 | 180~360만원 |
| 1년+ | 30,000+ | 150~300건 | 360~720만원 |

---

## 9. 구현 단계

### Phase 1: MVP (2~3주)
- Supabase 스키마 세팅
- 노트북 제품 30개 수동 + AI 보조 등록
- Next.js 사이트: 카테고리, 제품 상세, 비교 페이지
- 쿠팡파트너스 링크 연동
- Vercel 배포

### Phase 2: 자동화 (2~3주)
- Python 크롤러 (삼성/LG/ASUS/레노버)
- AI 스펙 추출 + 검증
- AI 리뷰/비교 콘텐츠 자동 생성
- 가격 자동 업데이트

### Phase 3: SEO + 콘텐츠 (2~3주)
- 구매 가이드 페이지
- 랭킹 페이지 (스펙 기준)
- Schema.org 구조화 데이터
- 사이트맵 자동 생성
- Google Search Console 연동

### Phase 4: 분석 + 최적화 (지속)
- Google Analytics 연동
- 쿠팡 수익 대시보드
- A/B 테스트 (CTA 위치/문구)
- 카테고리 확장 (에어컨, 청소기 등)

---

## 10. SEO 전략

### 타겟 키워드 구조

```
[카테고리] "노트북 추천" "게이밍 노트북 추천 2026"
[제품] "ASUS ROG Strix G16 스펙" "ASUS ROG Strix G16 후기"
[비교] "맥북 프로 vs 갤럭시북 프로" "ROG vs TUF 차이"
[랭킹] "배터리 오래가는 노트북" "가성비 노트북 순위"
[가이드] "노트북 고르는 법" "CPU i7 vs i9 차이"
```

### 기술적 SEO

| 항목 | 구현 |
|------|------|
| SSG/ISR | Next.js 정적 생성 + 주기적 재생성 |
| Schema.org | Product, Review, BreadcrumbList 마크업 |
| 사이트맵 | 자동 생성 (next-sitemap) |
| 메타 태그 | 페이지별 title, description 자동 생성 |
| Open Graph | 소셜 공유 최적화 |
| 모바일 최적화 | 반응형 (모바일 퍼스트) |
| Core Web Vitals | SSG + 이미지 최적화 (next/image) |
