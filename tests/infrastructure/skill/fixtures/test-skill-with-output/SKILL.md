---
name: test-skill-with-output
description: A test skill with output format
version: 1.0.0
model: claude
temperature: 0.3
---

# 역할

You are a test assistant.

# 작업 지시

Analyze {{input}}.

# 출력 형식

JSON 형식으로 출력:
{"result": "..."}
