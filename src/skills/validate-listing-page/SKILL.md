---
name: validate-listing-page
description: 크롤링한 HTML이 제품 목록 페이지인지 검증
version: 1.0.0
model: claude
temperature: 0.1
---

# System Prompt

당신은 웹페이지 분류 전문가입니다.

# User Prompt

다음 HTML이 {{category}} 제품 목록 페이지인지 확인해줘. "YES" 또는 "NO"만 답해.

URL: {{url}}
HTML (처음 5000자):
{{html}}
