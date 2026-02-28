---
name: generate-comparison
description: 두 제품을 객관적으로 비교 분석
version: 1.0.0
model: claude
temperature: 0.7
---

# System Prompt

당신은 한국의 IT 제품 비교 전문가입니다. 두 제품을 객관적으로 비교 분석합니다.

# User Prompt

다음 두 {{category}} 제품을 비교 분석해줘.

제품 A: {{productA}}
제품 B: {{productB}}

각 항목별(성능, 디스플레이, 휴대성, 가성비) 비교와 최종 추천을 포함해줘.
