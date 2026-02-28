# 01. 제품 데이터 수집 (Product Data Collection)

## 목적

제조사 홈페이지에서 제품 스펙을 크롤링하고, AI가 정확성을 검증하여 제품 DB를 구축한다.
비교 사이트의 핵심 자산은 **정확하고 구조화된 제품 데이터**이다.

---

## 데이터 수집 프로세스

```
제조사 홈페이지 (삼성/LG/ASUS/레노버/HP/Dell...)
    │
    ├── Playwright 크롤링 (제품 페이지 HTML)
    │
    ├── AI 스펙 추출 (Claude)
    │     "이 HTML에서 노트북 스펙을 추출해줘"
    │     → CPU, RAM, 저장장치, GPU, 디스플레이, 배터리, 무게, 가격...
    │
    ├── AI 정확성 검증
    │     "추출된 스펙이 원본 페이지와 일치하는지 확인해줘"
    │     → 불일치 항목 플래그 → 수동 검토
    │
    └── Supabase DB 저장
          products + product_specs 테이블
```

---

## 크롤링 전략

### 브랜드별 크롤러

| 브랜드 | 제품 페이지 구조 | 크롤링 난이도 | 비고 |
|--------|---------------|-------------|------|
| 삼성 | samsung.com/sec/ | 중간 | SPA, 동적 로딩 |
| LG | lg.com/kr/ | 중간 | 비교적 정적 |
| ASUS | asus.com/kr/ | 쉬움 | 스펙 테이블 명확 |
| 레노버 | lenovo.com/kr/ | 중간 | 모델 변형 많음 |
| HP | hp.com/kr/ | 어려움 | 동적 렌더링 많음 |
| Dell | dell.com/kr/ | 어려움 | 커스텀 구성 옵션 |
| Apple | apple.com/kr/ | 쉬움 | 스펙 페이지 깔끔 |

### 크롤러 공통 인터페이스

```python
class BaseCrawler:
    async def discover_products(self) -> list[str]:
        """신규 제품 URL 목록 발견"""

    async def crawl_product(self, url: str) -> RawProductData:
        """개별 제품 페이지 크롤링 → 원시 데이터"""

    async def extract_specs(self, raw: RawProductData) -> ProductSpecs:
        """AI로 스펙 추출"""

    async def validate_specs(self, specs: ProductSpecs, raw: RawProductData) -> ValidationResult:
        """AI로 정확성 검증"""
```

### 크롤링 주기

| 작업 | 주기 | 설명 |
|------|------|------|
| 신규 제품 발견 | 주 1회 | 제조사 신제품 페이지 모니터링 |
| 스펙 업데이트 | 월 1회 | 기존 제품 스펙 변경 확인 |
| 가격 업데이트 | 일 1회 | 쿠팡 가격 수집 (별도 파이프라인) |

---

## AI 스펙 추출

### 프롬프트 전략

```
[시스템 프롬프트]
당신은 노트북 스펙 전문가입니다.
제조사 제품 페이지의 HTML에서 정확한 스펙 정보를 추출합니다.

[사용자 프롬프트]
다음 HTML에서 노트북 스펙을 JSON 형태로 추출하세요:
- cpu: 프로세서 모델명
- ram: 메모리 용량 (GB)
- storage: 저장장치 용량 및 유형
- gpu: 그래픽카드 모델명
- display_size: 화면 크기 (인치)
- display_resolution: 해상도
- display_refresh_rate: 주사율 (Hz)
- battery: 배터리 용량 (Wh)
- weight: 무게 (kg)
- os: 운영체제
- price: 출시가 (원)

HTML:
{crawled_html}
```

### 정확성 검증

```
추출된 스펙:
{extracted_specs}

원본 HTML:
{crawled_html}

위 스펙이 원본 HTML의 정보와 정확히 일치하는지 검증하세요.
불일치 항목이 있다면 지적하고 올바른 값을 제시하세요.
```

**검증 결과 처리**:
- 전체 일치: 자동 승인 → DB 저장
- 부분 불일치: 자동 수정 → 재검증
- 다수 불일치: 수동 검토 플래그

---

## 노트북 스펙 항목 정의

| spec_key | display_name | 타입 | 필터 가능 | 비교표 포함 | 단위 |
|----------|-------------|------|----------|-----------|------|
| cpu | 프로세서 | text | ✅ | ✅ | - |
| cpu_cores | 코어 수 | number | ✅ | ✅ | 개 |
| ram | 메모리 | number | ✅ | ✅ | GB |
| storage | 저장장치 | text | ✅ | ✅ | - |
| storage_capacity | 저장 용량 | number | ✅ | ✅ | GB |
| gpu | 그래픽카드 | text | ✅ | ✅ | - |
| gpu_vram | GPU 메모리 | number | ✅ | ✅ | GB |
| display_size | 화면 크기 | number | ✅ | ✅ | 인치 |
| display_resolution | 해상도 | text | ✅ | ✅ | - |
| display_refresh_rate | 주사율 | number | ✅ | ✅ | Hz |
| battery | 배터리 | number | ✅ | ✅ | Wh |
| weight | 무게 | number | ✅ | ✅ | kg |
| os | 운영체제 | text | ✅ | ✅ | - |
| usb_c | USB-C 포트 | number | ❌ | ✅ | 개 |
| hdmi | HDMI | boolean | ❌ | ✅ | - |
| thunderbolt | Thunderbolt | boolean | ❌ | ✅ | - |
| wifi | Wi-Fi | text | ❌ | ✅ | - |

---

## 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 제조사 사이트 구조 변경 | 브랜드별 셀렉터 모듈화, 변경 감지 알림 |
| 크롤링 차단 | 요청 간격 조절, User-Agent 로테이션, 주거용 프록시(Residential Proxy) 및 Playwright Stealth 도입 |
| AI 스펙 추출 오류 | 이중 검증 (추출 + 검증), 수동 검토 프로세스 |
| 파이프라인 장애 | 크롤링 실패, API 한도 초과 등 치명적 자동화 오류 발생 시 슬랙/디스코드 실시간 알림 |
| 제품 모델 변형 많음 | 모델 번호 기준 중복 체크, 변형 그룹핑 |
| 이미지 저작권 | 제조사 공식 이미지 사용 + 출처 표기 |
