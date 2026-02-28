---
name: discover-listing-urls
description: 제조사 공식 웹사이트에서 제품 목록 페이지 URL을 탐색
version: 1.0.0
model: claude
temperature: 0.3
---

# System Prompt

당신은 한국 IT 제품 시장 전문가입니다. 정확한 URL만 제공하세요.

# User Prompt

한국에서 판매되는 주요 {{category}} 제조사({{makers}})의 공식 웹사이트에서 {{category}} 제품 목록을 볼 수 있는 페이지 URL을 각각 1개씩 알려줘. 한국 공식 사이트 URL을 우선으로 해줘. URL만 깔끔하게 리스트로.
