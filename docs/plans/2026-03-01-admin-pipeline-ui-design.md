# Admin Pipeline UI Design

**Date:** 2026-03-01
**Status:** Approved

## Overview

A web-based admin page (`/admin`) for triggering and monitoring the full content pipeline (discover → crawl → review → compare). Uses a Worker Process + DB Job Queue pattern — the industry-standard approach (identical to GoodJob for Rails, pg-boss for Node.js) — to handle long-running pipeline execution without HTTP timeout issues.

## Why Worker Process + DB Queue

Node.js is single-threaded. Running a 30+ minute pipeline in an API Route would block the event loop and hit HTTP timeouts. The solution is to separate concerns:

- **Next.js process** — handles HTTP only; never runs long tasks
- **Worker process** — runs pipeline; never handles HTTP

This is the same pattern Rails uses with GoodJob (async mode aside, which requires multi-threading unavailable in Node.js).

## Architecture

```
Same server, two processes:

Process 1: Next.js (web)           Process 2: Worker
  API Routes (HTTP only)    ←DB→     Polls PipelineJob every 3s
  Admin UI                           Runs pipeline on job found
  POST job → DB                      Writes logs to PipelineLog
  GET status ← DB                    Updates job status in DB
        ↓                                      ↓
        └──────── PostgreSQL (same DB) ────────┘
```

**Development:**
```bash
npm run dev     # terminal 1 — Next.js
npm run worker  # terminal 2 — Worker
```

**Production (PM2 / Procfile):**
```
web:    npm run start
worker: npm run worker
```

No Redis, no extra services — uses existing PostgreSQL only.

## New Files

```
src/
  worker/
    index.ts              ← Polling loop + job dispatcher
    PipelineRunner.ts     ← Wraps pipeline.ts with DB log callback
  app/
    admin/
      page.tsx            ← Admin UI (3 tabs)
    api/admin/
      pipeline/route.ts   ← POST: create job | GET: latest status + logs
      schedule/route.ts   ← GET/PUT: scheduler config
```

## Prisma Schema Additions

```prisma
model PipelineJob {
  id          String        @id @default(cuid())
  status      JobStatus     @default(PENDING)
  triggeredBy TriggerSource
  category    String
  makers      String[]
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime      @default(now())
  logs        PipelineLog[]
}

model PipelineLog {
  id        String      @id @default(cuid())
  jobId     String
  job       PipelineJob @relation(fields: [jobId], references: [id])
  message   String
  createdAt DateTime    @default(now())
}

model PipelineSchedule {
  id        String   @id @default(cuid())
  enabled   Boolean  @default(false)
  frequency String   @default("daily")  // "daily" | "weekly"
  hour      Int      @default(3)        // 0-23
  minute    Int      @default(0)
  dayOfWeek Int?                        // 0-6, null if daily
  category  String   @default("노트북")
  makers    String[]
  updatedAt DateTime @updatedAt
}

enum JobStatus     { PENDING RUNNING DONE FAILED }
enum TriggerSource { MANUAL SCHEDULER }
```

## Admin UI — 3 Tabs

### Tab 1: 수동 실행

```
카테고리:  [노트북 ▼]
제조사:    [Samsung ×] [LG ×] [ASUS ×] [Apple ×] [Lenovo ×] [+ 추가]

마지막 실행: 2026-02-28 09:12  ✅ 성공 (23개 저장)

[▶ 전체 파이프라인 실행]   ← confirm 다이얼로그 후 실행
```

Running (3초 폴링):
```
⏳ 실행 중... (12분 경과)
┌──────────────────────────────────────────────┐
│ [09:15:02] Pipeline starting: 7 listing pages │
│ [09:15:05] Found 8 product pages              │
│ [09:15:10]   Saved: Samsung Galaxy Book4 Pro  │
│ ...                                           │
└──────────────────────────────────────────────┘
```

### Tab 2: 스케줄러

```
자동 실행  [●────] ON
주기       [매일 ▼]
실행 시각  [오전 3시 ▼]
카테고리   [노트북 ▼]
제조사     [Samsung ×] [LG ×] ...

다음 실행: 2026-03-02 03:00
[저장]
```

### Tab 3: 실행 기록

```
2026-03-01 03:00  🕐 자동  ✅ 성공  3분 42초  [로그]
2026-02-28 14:23  ⚡ 수동  ✅ 성공  4분 11초  [로그]
2026-02-27 03:00  🕐 자동  ❌ 실패  0분 32초  [로그]
```

## API

**POST `/api/admin/pipeline`** — create job
```json
// Request (optional — falls back to schedule defaults)
{ "category": "노트북", "makers": ["Samsung", "LG"] }
// 200: { "jobId": "...", "status": "PENDING" }
// 409: { "error": "Pipeline already running" }
```

**GET `/api/admin/pipeline`** — latest job + last 50 log lines
```json
{
  "job": { "id": "...", "status": "RUNNING", "startedAt": "...", "triggeredBy": "MANUAL" },
  "logs": ["[09:15:02] Pipeline starting...", "..."]
}
```

**GET/PUT `/api/admin/schedule`** — scheduler config

## Worker Implementation

```typescript
// src/worker/index.ts
async function pollLoop() {
  while (true) {
    const job = await db.pipelineJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })
    if (job) await runJob(job)
    await sleep(3000)
  }
}
```

Scheduler (`node-cron`) also lives in the Worker process. On startup, reads `PipelineSchedule` from DB and registers cron job. When schedule is saved via UI, Worker re-reads on next startup or via signal.

## Pipeline Refactoring

`src/cli/pipeline.ts` uses `console.log` directly. Needs a `log` callback parameter so Worker can route to DB. CLI scripts continue to work by passing `console.log` as the callback.

```typescript
// Before: console.log(`Saved: ${specs.maker}`)
// After:  log(`Saved: ${specs.maker}`)

// CLI usage (unchanged behavior):
runPipeline(params, console.log)

// Worker usage:
runPipeline(params, (msg) => db.pipelineLog.create({ data: { jobId, message: msg } }))
```

## Safety

- One running job at a time (409 if duplicate attempted)
- Confirm dialog on manual run button
- No authentication (internal use only)

## Cloud Deployment

Works identically on any PaaS:
```
Render / Heroku / Fly.io:
  web:    npm run start
  worker: npm run worker
  (both connect to same DATABASE_URL)
```
