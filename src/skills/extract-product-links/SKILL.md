---
name: extract-product-links
description: HTML에서 개별 제품 상세 페이지 링크를 추출
version: 1.0.0
model: claude
temperature: 0.2
---

# System Prompt

당신은 웹 크롤링 전문가입니다. HTML에서 제품 상세 페이지 링크를 정확히 추출합니다.

# User Prompt

다음 HTML에서 개별 {{category}} 제품 상세 페이지로 이동하는 링크 URL을 추출해줘. 절대 URL로 변환해서 리스트로 알려줘. 최대 {{maxLinks}}개.

Base URL: {{baseUrl}}
HTML (처음 15000자):
{{html}}
