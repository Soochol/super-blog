# Super Blog 전체 파이프라인 설계

## 개요

노트북 비교 블로그의 데이터 수집 → AI 콘텐츠 생성 → 수익화 → 프론트엔드 확장까지 전체 파이프라인을 구체화하는 설계 문서.

## 결정 사항

| 항목 | 결정 |
|---|---|
| DB | 로컬 Docker PostgreSQL |
| 크롤링 대상 | 제조사 공식 사이트 (Apple, Samsung, ASUS 등) |
| AI 텍스트 생성 | `claude -p` (CLI 파이프 모드), 나중에 API 전환 가능 |
| 제품 이미지 | 제조사 사이트에서 수집 + 리사이즈/가공 |
| 배포 | 로컬 PC에서 시작, 나중에 VPS 또는 Vercel 이전 가능 |
| 쿠팡 API | 미보유 (나중에 연동) |
| 카테고리 | 노트북만 집중 |

## 1. 전체 아키텍처

```
┌──────────────────────────────────────────────────┐
│                 로컬 PC (개발 + 실행)               │
│                                                    │
│  ┌─────────────┐   ┌──────────────────────────┐   │
│  │ PostgreSQL  │   │   Next.js Dev Server     │   │
│  │ (Docker)    │◄──│   localhost:3000          │   │
│  └──────┬──────┘   └──────────────────────────┘   │
│         │                                          │
│  ┌──────▼──────────────────────────────────────┐   │
│  │         CLI 데이터 엔진 (npm run pipeline)    │   │
│  │                                              │   │
│  │  0. URL 탐색 (claude -p) ──► 제조사 목록 URL  │   │
│  │  1. 크롤링 (Playwright) ──► 제조사 사이트     │   │
│  │  2. 스펙 추출 (Gemini API)                   │   │
│  │  3. 제품 이미지 수집 + 가공                    │   │
│  │  4. 리뷰 생성 (claude -p)                    │   │
│  │  5. DB 저장 (Prisma)                         │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**핵심 원칙:**
- CLI 데이터 엔진: 터미널에서 실행하는 Node.js 스크립트 (`src/cli/`)
- Next.js는 DB에서 읽기만 함 (SSR/SSG)
- `claude -p`는 CLI 스크립트 내에서 `child_process`로 호출
- 모든 AI 호출은 포트/어댑터 패턴 — 나중에 LLM API로 전환 가능

## 2. 데이터 파이프라인

### 2-0. URL 자동 탐색 (LLM 기반)

```
[0단계] 제조사 목록 URL 탐색
────────────────────────────
claude -p에게 "한국에서 판매되는 주요 노트북 제조사의
공식 노트북 목록 페이지 URL을 찾아줘" 요청
→ URL 후보 목록 반환

[검증] Playwright로 각 URL 실제 접속
→ 페이지 로드 성공 여부 확인
→ LLM에게 "이 페이지가 실제 노트북 목록 페이지 맞아?" 재확인
→ 검증된 URL만 DB/설정에 저장
```

사람은 최초 명령어 1회만 실행. LLM이 URL 탐색 + 검증까지 자동 처리.

### 2-1. 크롤링 → 추출 → 저장 흐름

```
[1단계] 제품 링크 수집          [2단계] 개별 크롤링         [3단계] 스펙 추출 + 저장
───────────────────          ──────────────────       ──────────────────
검증된 목록 페이지에서          각 제품 URL에              Gemini로 HTML에서
개별 제품 페이지 링크      →   Playwright 접속        →  구조화된 스펙 추출
자동 수집 (Playwright)         HTML 수집                  + 제품 이미지 URL 추출
                                                          Prisma로 DB 저장
```

### 2-2. 이미지 수집 + 가공

```
[4단계] 제품 이미지 수집 + 가공
─────────────────────────
크롤링 시 제조사 제품 이미지 URL을 함께 추출
→ 이미지 다운로드
→ 리사이즈/포맷 변환 (사이트 스타일에 맞게)
→ public/images/products/ 에 저장
```

AI 이미지 생성이 아닌, 실제 제조사 이미지를 활용하여 신뢰성 확보.

### 2-3. AI 콘텐츠 생성 흐름

```
[5단계] 리뷰 생성
───────────────────
DB에서 제품 스펙 로드
claude -p에 프롬프트 전달
리뷰 텍스트 반환
DB에 ProductReview 저장
```

### 2-4. CLI 스크립트 구조

```
src/cli/
├── discover.ts           # LLM 기반 제조사 URL 탐색 + 검증
├── crawl.ts              # 크롤링 명령어 (목록→개별→스펙추출→이미지수집)
├── generate-review.ts    # AI 리뷰 생성 (claude -p 호출)
└── pipeline.ts           # 위 모든 단계를 순서대로 실행
```

npm 스크립트 예시:
```bash
npm run pipeline:discover                    # LLM이 제조사 URL 탐색 + 검증
npm run pipeline:crawl                       # 검증된 URL에서 제품 자동 크롤링
npm run pipeline:review -- --product-id 1    # 특정 제품 리뷰 생성
npm run pipeline:all                         # 전체 파이프라인 실행
```

### 2-5. Skill 기반 프롬프트 관리

모든 LLM 호출은 `skill` 도메인의 `AiSkill`을 통해 프롬프트를 주입받는다. 프롬프트가 코드에 하드코딩되지 않으며, DB의 스킬 레코드를 수정하면 코드 변경 없이 프롬프트를 업데이트할 수 있다.

```typescript
// 호출 흐름
const skill = await skillRepo.findByName('discover-listing-urls');
const prompt = injectContextToPrompt(skill.userPromptTemplate, { category: '노트북' });
const result = await llmAdapter.run(prompt, {
  system: skill.systemPromptTemplate,
  model: skill.model,
  temperature: skill.temperature,
});
```

**파이프라인에서 사용하는 Skill 목록:**

| Skill 이름 | 용도 | 기본 모델 |
|---|---|---|
| `discover-listing-urls` | 제조사 목록 페이지 URL 탐색 | claude |
| `validate-listing-page` | 페이지가 노트북 목록인지 검증 | claude |
| `extract-product-links` | 목록에서 개별 제품 링크 추출 | claude |
| `extract-product-image` | HTML에서 메인 제품 이미지 URL 추출 | claude |
| `extract-specs` | HTML에서 스펙 구조화 추출 | gemini |
| `validate-specs` | 추출된 스펙의 정확성 검증 | gemini |
| `generate-review` | 제품 리뷰 기사 생성 | claude |
| `generate-comparison` | 제품 비교 기사 생성 | claude |

Skill은 Prisma `AiSkill` 모델에 저장되며, seed 스크립트로 초기 Skill 세트를 등록한다.

### 2-6. `claude -p` / LLM API 호출 방식

```typescript
// src/infrastructure/ai/ClaudeCliAdapter.ts
// claude -p 사용 시: Skill의 system/user 프롬프트 + model 정보를 활용
class ClaudeCliAdapter implements LlmRunner {
  async run(prompt: string, opts: { system?: string; model?: string }): Promise<string> {
    const args = ['-p', prompt];
    if (opts.system) args.push('--system', opts.system);
    if (opts.model) args.push('--model', opts.model);
    const { stdout } = await execFileAsync('claude', args, { timeout: 120_000 });
    return stdout.trim();
  }
}

// LLM API 전환 시: 동일한 Skill 데이터를 API 파라미터로 매핑
class ClaudeApiAdapter implements LlmRunner {
  async run(prompt: string, opts: { system?: string; model?: string }): Promise<string> {
    // Vercel AI SDK 또는 Anthropic SDK 사용
  }
}
```

### 2-7. 포트/어댑터 전환 구조

```
LlmRunner (포트, 신규)      →  ClaudeCliAdapter (지금) / ClaudeApiAdapter (나중)
SpecExtractor (포트)        →  GeminiAdapter (지금) / 다른 모델 (나중)
ImageCollector (포트, 신규)  →  PlaywrightImageCollector (지금) / CDN 등 (나중)
SkillRepository (포트, 신규) →  PrismaSkillRepository (지금) / FileSkillRepository (나중)
```

기존 `ContentGenerator`, `UrlDiscoverer` 등 기능별 포트 대신, 범용 `LlmRunner` 포트 + Skill 조합으로 단순화. Skill이 "무엇을 할지"를 정의하고, LlmRunner가 "어떻게 실행할지"를 담당.

### 2-8. DB 스키마

기존 Prisma 스키마의 모델을 그대로 활용:
- `Product` — 크롤링된 스펙 저장
- `CrawlHistory` — 크롤링 이력 추적
- `ProductReview` — AI 생성 리뷰 저장
- `WebReviewReference` — 외부 리뷰 참조
- `Category`, `CategoryAssignment` — 카테고리 관리
- `EventLog` — 이벤트 로깅

Docker Compose로 PostgreSQL 실행:
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

## 3. 수익화 & 운영

### 3-1. 쿠팡 연동 (API 키 발급 후)

기존 `CoupangProvider`의 HMAC 인증 로직 활용, 스텁 → 실제 호출 교체:
- `generateLink()` — 실제 쿠팡 딥링크 생성
- `fetchLowestPrice()` — 최저가 조회
- API 키 미보유 시 placeholder URL 유지 (현재 동작 그대로)

### 3-2. 클릭 추적

`BuyButtonCTA` 클릭 → `AnalyticsTracker` 포트 → DB `EventLog` 저장:
- 제품 ID, CTA 유형, 타임스탬프 기록
- 나중에 전환율 대시보드 추가 가능

인프라 구현체: `PrismaAnalyticsTracker` — `EventLog` 테이블에 INSERT

### 3-3. SEO 자동화

- `Publisher` 포트 구현: `SitemapPublisher`
  - `sitemap.xml` 자동 생성 (Next.js App Router 방식)
  - `robots.txt` 설정
  - JSON-LD 구조화된 데이터 (Product, Review 스키마)
- 기존 `generateMetadata` 활용 (이미 구현됨)

### 3-4. 운영 우선순위

1. **먼저**: 클릭 추적 + SEO 자동화 (API 키 불필요)
2. **나중에**: 쿠팡 실제 연동 (API 키 발급 후)

## 4. 프론트엔드 확장

### 4-1. 즉시 수정 (현재 스텁 상태인 것들)

- **검색 기능**: Header의 검색 input에 핸들러 연결, 제품명/카테고리 필터링
- **모바일 메뉴**: 햄버거 버튼에 드로어/슬라이드 메뉴 구현
- **누락 페이지**: `/terms`, `/privacy` 페이지 생성

### 4-2. 새 페이지 (콘텐츠 축적 후)

- 랭킹 페이지: `/laptop/rank/[criterion]` (성능, 가성비, 배터리 등)
- 가이드 페이지: `/guide/[slug]` (게이밍 노트북 가이드 등)

### 4-3. 데이터 소스 전환

`src/lib/api.ts`의 정적 JSON 읽기 → Prisma DB 쿼리로 교체:
```typescript
// Before
export const getProducts = async () => productsData;

// After
export const getProducts = async () => prisma.product.findMany();
```

`generateStaticParams`는 유지하되 데이터 소스만 변경.

## 5. 구현 순서

### Phase 1: 데이터 파이프라인 (기반)
1. Docker Compose로 PostgreSQL 설정
2. Prisma 마이그레이션 실행
3. `src/lib/api.ts` JSON → Prisma 쿼리 전환
4. CLI 스크립트 구조 (`src/cli/`) 생성
5. 크롤링 → 추출 → 저장 파이프라인 실동작

### Phase 2: AI 콘텐츠 생성 (핵심 가치)
1. `ClaudeCliAdapter` 구현 (claude -p 호출)
2. 리뷰/비교 기사 생성 파이프라인 완성
3. 생성된 콘텐츠 DB 저장 + 프론트엔드 연동

### Phase 3: 수익화 & 운영 (비즈니스)
1. 클릭 추적 (`PrismaAnalyticsTracker`) 구현
2. SEO 자동화 (sitemap, robots.txt, JSON-LD)
3. 쿠팡 API 실제 연동 (키 발급 후)

### Phase 4: 프론트엔드 확장 (UX 완성)
1. 검색 기능, 모바일 메뉴 구현
2. `/terms`, `/privacy` 페이지
3. 랭킹/가이드 페이지 (콘텐츠 축적 후)
