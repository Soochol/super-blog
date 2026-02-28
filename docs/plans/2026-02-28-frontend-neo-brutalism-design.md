# Frontend Pages Design: Neo-Brutalism Style

## 1. Overview
Super Blog의 프론트엔드 UI/UX를 "네오 브루탈리즘(Neo-Brutalism)" 스타일로 개편 및 고도화하는 디자인 명세서입니다. 제휴 마케팅(쿠팡 파트너스) 최적화를 위해 클릭 유도율(CTR)을 극대화하고, MZ세대를 타겟으로 한 힙하고 개성 있는 브랜드 정체성을 확립하는 것이 목표입니다.

## 2. Visual System (비주얼 시스템)

### 2.1 Colors
*   **Background (배경):** `#FDFBF7` (눈이 편안한 옅은 크림/오프화이트)
*   **Borders & Text (테두리 및 텍스트):** `#000000` (순흑색, 완전한 대비)
*   **Accent Colors (강조 원색):**
    *   Primary Action (CTA): `#FF3366` (네온 핑크) 또는 `#FF9B00` (쿠팡 오렌지 변형)
    *   Highlight / Tech: `#00E5FF` (일렉트릭 블루)
    *   Warning / Sale: `#FFEB3B` (형광 옐로우)
    *   Success / Pros: `#00E676` (비비드 그린)

### 2.2 Typography
*   **Headings (제목):** Pretendard Black 또는 기타 매우 굵고 힘있는 고딕/단행본 폰트. 대문자(알파벳)와 굵은 한글 텍스트를 통해 시각적 압도감 제공.
*   **Body (본문):** Pretendard Medium/Regular. 가독성을 해치지 않도록 넓은 자간/행간 유지.

### 2.3 UI Components & Interaction
*   **Borders:** 모든 카드, 입력창, 주요 버튼에 굵은 테두리(3px~4px solid black) 적용.
*   **Shadows (Hard Drop Shadow):** 흐림(blur)이 0인 단단한 검은색 그림자 (예: `box-shadow: 4px 4px 0px black`).
*   **Hover / Click Effects:** 
    *   마우스 오버(Hover): 그림자 오프셋이 커지거나 약간 회전.
    *   클릭(Active): 그림자가 0px로 줄어들고 버튼이 눌리는(Translate) 물리적 애니메이션으로 강렬한 타격감(클릭감) 제공.

## 3. Layout Structure (레이아웃 구조 - Homepage 기준)

### 3.1 Hero Section
*   페이지 최상단. 형광 옐로우 배경, 매우 큰 폰트의 블로그 캐치프레이즈.
*   우측 혹은 중앙에 굵은 테두리를 가진 최신 전자기기 이미지.
*   핵심 CTA 버튼: "최신 랭킹 확인하기".

### 3.2 Quick Categories
*   알약 모양의 굵은 테두리 버튼 목록 (가로 스크롤 혹은 Wrap 형태).
*   각 라벨은 다채로운 원색 배경 (보라, 민트, 핑크 등) 적용하여 시각적 즐거움 제공.

### 3.3 "BEST OF 2026" Ranking Grid
*   홈페이지의 수익화 핵심 영역. 
*   2~3열의 굵은 테두리 카드 그리드.
*   각 카드 구성 요소:
    *   오버사이즈 순위 뱃지 (예: 강렬한 빨간색 네모 뱃지 안에 '1')
    *   제품 누끼 이미지 (밝은 배경)
    *   제품명 및 짧은 스펙 (체크리스트 형태)
    *   거대한 Width 100% CTA 버튼 ("최저가 확인"). 누르는 맛을 극대화한 Neo-Brutalism 버튼.

### 3.4 Latest Reviews Feed
*   매거진 형태의 리스트뷰. 
*   가독성에 초점을 맞추되, 각 아티클 간 구분선이나 날짜/태그 라벨 등에만 굵은 검은색 테두리 포인트 사용.

## 4. Next Steps
*   `tailwind.config.ts`에 네오 브루탈리즘 테마(컬러, 박스 섀도우 커스텀 유틸리티) 설정.
*   공통 버튼(`BuyButtonCTA` 등), 카드(`ProductCard`) 컴포넌트를 이 디자인 언어에 맞게 리팩토링.
*   홈페이지(`page.tsx`)에 제안된 레이아웃 구조 적용 및 스타일링.
