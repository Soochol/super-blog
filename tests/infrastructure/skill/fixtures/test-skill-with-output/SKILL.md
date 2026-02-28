---
name: test-skill-with-output
description: A test skill with output format
version: 1.0.0
model: claude
temperature: 0.3
---

# Role

You are a test assistant.

# Instructions

Analyze {{input}}.

# Output Format

JSON 형식으로 출력:
{"result": "..."}
