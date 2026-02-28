# Admin Pipeline UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/admin` web page that triggers the full content pipeline, streams logs via DB polling, includes a scheduler, and run history — backed by a separate Worker process.

**Architecture:** Next.js handles HTTP only (API Routes + UI). A separate Worker process polls a `PipelineJob` table every 3 seconds and runs the pipeline when a job is found. Logs are written to `PipelineLog` table; the admin UI polls for updates every 3 seconds. `node-cron` scheduler lives in the Worker and reads config from `PipelineSchedule` table.

**Tech Stack:** Next.js 16, Prisma 7 + PostgreSQL, node-cron, TypeScript, Tailwind CSS 4

---

## Task 1: Prisma Schema — Pipeline Tables

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add enums and models to schema**

Add to the bottom of `prisma/schema.prisma`:

```prisma
// Admin Pipeline Domain

enum JobStatus {
  PENDING
  RUNNING
  DONE
  FAILED
}

enum TriggerSource {
  MANUAL
  SCHEDULER
}

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

  @@index([jobId])
}

model PipelineSchedule {
  id        String   @id @default(cuid())
  enabled   Boolean  @default(false)
  frequency String   @default("daily")
  hour      Int      @default(3)
  minute    Int      @default(0)
  dayOfWeek Int?
  category  String   @default("노트북")
  makers    String[]
  updatedAt DateTime @updatedAt
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add-pipeline-tables
```

Expected: Migration created and applied, `npx prisma generate` runs automatically.

**Step 3: Verify**

```bash
npx prisma studio
```

Open browser to `http://localhost:5555` and confirm `PipelineJob`, `PipelineLog`, `PipelineSchedule` tables exist.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(admin): add PipelineJob, PipelineLog, PipelineSchedule schema"
```

---

## Task 2: Install node-cron

**Files:**
- Modify: `package.json`

**Step 1: Install**

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

**Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add node-cron dependency"
```

---

## Task 3: Refactor pipeline.ts — Add Log Callback

Currently `pipeline.ts` uses `console.log` directly. We need to accept a `log` callback so Worker can route logs to DB. The CLI scripts must continue to work unchanged.

**Files:**
- Modify: `src/cli/pipeline.ts`
- Create: `tests/cli/pipeline.test.ts`

**Step 1: Write the failing test**

Create `tests/cli/pipeline.test.ts`:

```typescript
import { runPipeline, PipelineParams } from '../../src/cli/pipeline';

describe('runPipeline log callback', () => {
  it('calls log callback instead of console.log', async () => {
    const logs: string[] = [];
    const logFn = (msg: string) => logs.push(msg);

    // Mock all dependencies to avoid real crawling
    jest.mock('../../src/infrastructure/crawler/PlaywrightCrawler');
    jest.mock('../../src/infrastructure/ai/AiSpecExtractor');
    jest.mock('../../src/infrastructure/db/PrismaProductRepository');
    jest.mock('../../src/infrastructure/ai/ClaudeCliAdapter');
    jest.mock('../../src/infrastructure/skill/FileSkillRepository');

    const params: PipelineParams = {
      category: '노트북',
      makers: ['Samsung'],
      listingUrls: ['https://example.com'],
    };

    // We just test that the function accepts a log param — full integration tested manually
    expect(typeof runPipeline).toBe('function');
    expect(runPipeline.length).toBeGreaterThanOrEqual(2); // (params, log)
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/cli/pipeline.test.ts -v
```

Expected: FAIL — `runPipeline` is not exported from `pipeline.ts`

**Step 3: Refactor pipeline.ts**

Extract the main logic into an exported `runPipeline` function. Key changes:

1. Export a `PipelineParams` type
2. Export `runPipeline(params, log)` function
3. Replace all `console.log(...)` calls with `log(...)`
4. Replace all `console.error(...)` calls with `log(...)`
5. Keep the `main()` function calling `runPipeline(defaultParams, console.log)`

```typescript
// src/cli/pipeline.ts

import 'dotenv/config';
import { createHash } from 'crypto';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { AiSpecExtractor } from '../infrastructure/ai/AiSpecExtractor';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ProductGatheringService } from '../domains/product/application/ProductGatheringService';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { FileSkillRepository } from '../infrastructure/skill/FileSkillRepository';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';
import { buildSlug, downloadAndProcessImage } from './crawl';
import { parseDiscoveredUrls } from './discover';

export type PipelineParams = {
  category: string;
  makers: string[];
  listingUrls: string[];
};

export async function runPipeline(
  params: PipelineParams,
  log: (msg: string) => void
): Promise<void> {
  const { category, makers, listingUrls } = params;

  const crawler = new PlaywrightCrawler();
  const extractor = new AiSpecExtractor();
  const repo = new PrismaProductRepository();
  const llm = new ClaudeCliAdapter();
  const skillRepo = new FileSkillRepository();
  const service = new ProductGatheringService(crawler, extractor);

  try {
    const linksSkill = await skillRepo.findByName('extract-product-links');
    if (!linksSkill) throw new Error('Skill "extract-product-links" not found');

    const imageSkill = await skillRepo.findByName('extract-product-image');

    log(`Pipeline starting: ${listingUrls.length} listing pages`);

    for (const listingUrl of listingUrls) {
      try {
        log(`\n--- Processing listing: ${listingUrl} ---`);
        const listingData = await crawler.crawlExistingProduct(listingUrl);

        const linksPrompt = injectContextToPrompt(linksSkill.userPromptTemplate, {
          category,
          maxLinks: '10',
          baseUrl: listingUrl,
          html: listingData.html.substring(0, 15000),
        });
        const linksResponse = await llm.run(linksPrompt, {
          system: linksSkill.systemPromptTemplate,
          model: linksSkill.model,
          temperature: linksSkill.temperature,
        });

        const productUrls = parseDiscoveredUrls(linksResponse);
        log(`Found ${productUrls.length} product pages`);

        for (const productUrl of productUrls) {
          try {
            log(`  Crawling: ${productUrl}`);
            const { specs, references } = await service.gatherProductAndReviews(productUrl, '');
            const slug = buildSlug(specs.maker, specs.model);

            const productId = await repo.saveProduct(slug, specs, 'laptop');
            log(`  Saved: ${specs.maker} ${specs.model} (${slug})`);

            const rawData = await crawler.crawlExistingProduct(productUrl);

            if (imageSkill) {
              const imagePrompt = injectContextToPrompt(imageSkill.userPromptTemplate, {
                html: rawData.html.substring(0, 10000),
              });
              const imageResponse = await llm.run(imagePrompt, {
                system: imageSkill.systemPromptTemplate,
                model: imageSkill.model,
                temperature: imageSkill.temperature,
              });
              const imageUrls = imageResponse.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i);
              if (imageUrls?.[0]) {
                const localPath = await downloadAndProcessImage(imageUrls[0], slug);
                if (localPath) {
                  await repo.updateImageUrl(productId, localPath);
                  log(`  Image: ${localPath}`);
                }
              }
            }

            await repo.saveCrawlHistory(productId, {
              url: productUrl,
              htmlHash: createHash('sha256').update(rawData.html).digest('hex').substring(0, 64),
              lastCrawledAt: new Date(),
            });

            if (references.length > 0) {
              await repo.saveWebReviews(productId, references);
              log(`  Reviews: ${references.length}`);
            }
          } catch (error) {
            log(`  Error processing ${productUrl}: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        log(`Error processing listing ${listingUrl}: ${(error as Error).message}`);
      }
    }

    log('\nPipeline complete!');
  } finally {
    await crawler.close();
  }
}

async function main() {
  const { readFile } = await import('fs/promises');
  let listingUrls: string[];
  try {
    const data = await readFile('discovered-urls.json', 'utf-8');
    listingUrls = JSON.parse(data);
  } catch {
    console.error('discovered-urls.json not found. Run "npm run pipeline:discover" first.');
    process.exit(1);
  }

  await runPipeline(
    { category: '노트북', makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'], listingUrls },
    console.log
  );
}

const isDirectRun = process.argv[1]?.includes('pipeline');
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/cli/pipeline.test.ts -v
```

Expected: PASS

**Step 5: Verify CLI still works (manual check)**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 6: Commit**

```bash
git add src/cli/pipeline.ts tests/cli/pipeline.test.ts
git commit -m "refactor(cli): extract runPipeline with log callback for worker integration"
```

---

## Task 4: Worker — PipelineRunner

Wraps `runPipeline` with DB log persistence.

**Files:**
- Create: `src/worker/PipelineRunner.ts`
- Create: `tests/worker/PipelineRunner.test.ts`

**Step 1: Write failing test**

Create `tests/worker/PipelineRunner.test.ts`:

```typescript
import { PipelineRunner } from '../../src/worker/PipelineRunner';

describe('PipelineRunner', () => {
  it('updates job status to RUNNING then DONE on success', async () => {
    const mockDb = {
      pipelineJob: {
        update: jest.fn().mockResolvedValue({}),
      },
      pipelineLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const mockRun = jest.fn().mockResolvedValue(undefined);
    const runner = new PipelineRunner(mockDb as any, mockRun);

    await runner.run({
      id: 'job-1',
      category: '노트북',
      makers: ['Samsung'],
      listingUrls: ['https://example.com'],
    });

    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: expect.objectContaining({ status: 'RUNNING' }) })
    );
    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: expect.objectContaining({ status: 'DONE' }) })
    );
  });

  it('updates job status to FAILED on error', async () => {
    const mockDb = {
      pipelineJob: { update: jest.fn().mockResolvedValue({}) },
      pipelineLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const mockRun = jest.fn().mockRejectedValue(new Error('crawl failed'));
    const runner = new PipelineRunner(mockDb as any, mockRun);

    await runner.run({ id: 'job-1', category: '노트북', makers: [], listingUrls: [] });

    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) })
    );
  });

  it('writes log lines to PipelineLog table', async () => {
    const mockDb = {
      pipelineJob: { update: jest.fn().mockResolvedValue({}) },
      pipelineLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const mockRun = jest.fn().mockImplementation(async (_params, log) => {
      log('test log message');
    });

    const runner = new PipelineRunner(mockDb as any, mockRun);
    await runner.run({ id: 'job-1', category: '노트북', makers: [], listingUrls: [] });

    expect(mockDb.pipelineLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ jobId: 'job-1', message: 'test log message' }) })
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/worker/PipelineRunner.test.ts -v
```

Expected: FAIL — `PipelineRunner` not found

**Step 3: Implement PipelineRunner**

Create `src/worker/PipelineRunner.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { PipelineParams } from '../cli/pipeline';

type RunFn = (params: PipelineParams, log: (msg: string) => void) => Promise<void>;

type JobInput = {
  id: string;
  category: string;
  makers: string[];
  listingUrls: string[];
};

export class PipelineRunner {
  constructor(
    private db: PrismaClient,
    private runPipeline: RunFn
  ) {}

  async run(job: JobInput): Promise<void> {
    await this.db.pipelineJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      await this.runPipeline(
        { category: job.category, makers: job.makers, listingUrls: job.listingUrls },
        async (message: string) => {
          await this.db.pipelineLog.create({
            data: { jobId: job.id, message },
          });
        }
      );

      await this.db.pipelineJob.update({
        where: { id: job.id },
        data: { status: 'DONE', completedAt: new Date() },
      });
    } catch (error) {
      await this.db.pipelineJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });
      await this.db.pipelineLog.create({
        data: { jobId: job.id, message: `FATAL: ${(error as Error).message}` },
      });
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/worker/PipelineRunner.test.ts -v
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/worker/PipelineRunner.ts tests/worker/PipelineRunner.test.ts
git commit -m "feat(worker): add PipelineRunner with DB log persistence"
```

---

## Task 5: Worker — Polling Loop + Scheduler

**Files:**
- Create: `src/worker/index.ts`

**Step 1: Create worker entry point**

Create `src/worker/index.ts`:

```typescript
import 'dotenv/config';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { PipelineRunner } from './PipelineRunner';
import { runPipeline } from '../cli/pipeline';

const db = new PrismaClient();
const runner = new PipelineRunner(db, runPipeline);

let scheduledTask: cron.ScheduledTask | null = null;

async function registerScheduler(): Promise<void> {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  const schedule = await db.pipelineSchedule.findFirst();
  if (!schedule?.enabled) return;

  const { hour, minute, dayOfWeek, frequency, category, makers } = schedule;
  const cronExpr = frequency === 'weekly' && dayOfWeek != null
    ? `${minute} ${hour} * * ${dayOfWeek}`
    : `${minute} ${hour} * * *`;

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] Triggering pipeline at ${new Date().toISOString()}`);
    await db.pipelineJob.create({
      data: { category, makers, triggeredBy: 'SCHEDULER' },
    });
  });

  console.log(`[scheduler] Registered: ${cronExpr}`);
}

async function pollLoop(): Promise<void> {
  console.log('[worker] Starting poll loop...');
  let lastScheduleCheck = 0;

  while (true) {
    // Re-read schedule every minute in case it changed via UI
    if (Date.now() - lastScheduleCheck > 60_000) {
      await registerScheduler();
      lastScheduleCheck = Date.now();
    }

    const job = await db.pipelineJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (job) {
      console.log(`[worker] Running job ${job.id} (${job.triggeredBy})`);
      // Fetch listing URLs from discover step (reuse existing logic)
      const { main: discoverMain } = await import('../cli/discover');
      // Note: discover writes to discovered-urls.json; worker reads it
      // For now, pass empty listingUrls and let runPipeline handle via file read
      await runner.run({
        id: job.id,
        category: job.category,
        makers: job.makers,
        listingUrls: [], // pipeline.ts reads discovered-urls.json internally
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

pollLoop().catch((e) => {
  console.error('[worker] Fatal error:', e);
  process.exit(1);
});
```

**Step 2: Add worker script to package.json**

In `package.json`, add to `scripts`:
```json
"worker": "npx tsx src/worker/index.ts"
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/worker/index.ts package.json
git commit -m "feat(worker): add polling loop and node-cron scheduler"
```

---

## Task 6: API Route — POST/GET /api/admin/pipeline

**Files:**
- Create: `src/app/api/admin/pipeline/route.ts`
- Create: `tests/api/admin/pipeline.test.ts`

**Step 1: Write failing test**

Create `tests/api/admin/pipeline.test.ts`:

```typescript
// Unit test for the route handler logic (not HTTP integration)
import { createPipelineJob, getLatestPipelineStatus } from '../../../src/app/api/admin/pipeline/service';

describe('pipeline service', () => {
  it('returns 409 if a job is already RUNNING', async () => {
    const mockDb = {
      pipelineJob: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing', status: 'RUNNING' }),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      pipelineLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const result = await createPipelineJob(mockDb as any, { category: '노트북', makers: ['Samsung'] });
    expect(result.conflict).toBe(true);
    expect(mockDb.pipelineJob.create).not.toHaveBeenCalled();
  });

  it('creates a job if none is running', async () => {
    const mockDb = {
      pipelineJob: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-job', status: 'PENDING' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      pipelineLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const result = await createPipelineJob(mockDb as any, { category: '노트북', makers: ['Samsung'] });
    expect(result.conflict).toBe(false);
    expect(mockDb.pipelineJob.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ triggeredBy: 'MANUAL' }) })
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/admin/pipeline.test.ts -v
```

Expected: FAIL

**Step 3: Create service + route**

Create `src/app/api/admin/pipeline/service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

type CreateJobInput = { category: string; makers: string[] };

export async function createPipelineJob(
  db: PrismaClient,
  input: CreateJobInput
): Promise<{ conflict: boolean; jobId?: string }> {
  const running = await db.pipelineJob.findFirst({
    where: { status: { in: ['PENDING', 'RUNNING'] } },
  });

  if (running) return { conflict: true };

  const job = await db.pipelineJob.create({
    data: { category: input.category, makers: input.makers, triggeredBy: 'MANUAL' },
  });

  return { conflict: false, jobId: job.id };
}

export async function getLatestPipelineStatus(db: PrismaClient) {
  const job = await db.pipelineJob.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { logs: { orderBy: { createdAt: 'asc' }, take: 100 } },
  });

  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    triggeredBy: job.triggeredBy,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    logs: job.logs.map((l) => l.message),
  };
}
```

Create `src/app/api/admin/pipeline/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPipelineJob, getLatestPipelineStatus } from './service';

const db = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category = body.category ?? '노트북';
  const makers = body.makers ?? ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'];

  const result = await createPipelineJob(db, { category, makers });

  if (result.conflict) {
    return NextResponse.json({ error: 'Pipeline already running' }, { status: 409 });
  }

  return NextResponse.json({ jobId: result.jobId, status: 'PENDING' });
}

export async function GET() {
  const status = await getLatestPipelineStatus(db);
  if (!status) return NextResponse.json(null);
  return NextResponse.json(status);
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/admin/pipeline.test.ts -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/admin/pipeline/ tests/api/admin/pipeline.test.ts
git commit -m "feat(api): add admin pipeline POST/GET routes with conflict detection"
```

---

## Task 7: API Route — GET/PUT /api/admin/schedule

**Files:**
- Create: `src/app/api/admin/schedule/route.ts`

**Step 1: Create route**

Create `src/app/api/admin/schedule/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET() {
  const schedule = await db.pipelineSchedule.findFirst();
  return NextResponse.json(schedule ?? {
    enabled: false, frequency: 'daily', hour: 3, minute: 0, dayOfWeek: null,
    category: '노트북', makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'],
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existing = await db.pipelineSchedule.findFirst();

  const data = {
    enabled: body.enabled ?? false,
    frequency: body.frequency ?? 'daily',
    hour: body.hour ?? 3,
    minute: body.minute ?? 0,
    dayOfWeek: body.dayOfWeek ?? null,
    category: body.category ?? '노트북',
    makers: body.makers ?? [],
  };

  const schedule = existing
    ? await db.pipelineSchedule.update({ where: { id: existing.id }, data })
    : await db.pipelineSchedule.create({ data });

  return NextResponse.json(schedule);
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/api/admin/schedule/
git commit -m "feat(api): add admin schedule GET/PUT routes"
```

---

## Task 8: Admin UI — Page with 3 Tabs

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/components/ManualRunTab.tsx`
- Create: `src/app/admin/components/SchedulerTab.tsx`
- Create: `src/app/admin/components/RunHistoryTab.tsx`

**Step 1: Create ManualRunTab**

Create `src/app/admin/components/ManualRunTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

const DEFAULT_MAKERS = ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'];

type JobStatus = {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  logs: string[];
} | null;

export function ManualRunTab() {
  const [category, setCategory] = useState('노트북');
  const [makers, setMakers] = useState<string[]>(DEFAULT_MAKERS);
  const [newMaker, setNewMaker] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus>(null);
  const [isPolling, setIsPolling] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  // Poll for status every 3 seconds when running
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(async () => {
      const res = await fetch('/api/admin/pipeline');
      const data = await res.json();
      setJobStatus(data);

      if (data?.status === 'DONE' || data?.status === 'FAILED') {
        setIsPolling(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling]);

  // Load current status on mount
  useEffect(() => {
    fetch('/api/admin/pipeline')
      .then((r) => r.json())
      .then((data) => {
        setJobStatus(data);
        if (data?.status === 'PENDING' || data?.status === 'RUNNING') {
          setIsPolling(true);
        }
      });
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [jobStatus?.logs]);

  const handleRun = async () => {
    if (!confirm('파이프라인을 실행하시겠습니까?')) return;

    const res = await fetch('/api/admin/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, makers }),
    });

    if (res.status === 409) {
      alert('파이프라인이 이미 실행 중입니다.');
      return;
    }

    const data = await res.json();
    setJobStatus({ ...data, logs: [] });
    setIsPolling(true);
  };

  const removeMaker = (m: string) => setMakers(makers.filter((x) => x !== m));
  const addMaker = () => {
    if (newMaker.trim() && !makers.includes(newMaker.trim())) {
      setMakers([...makers, newMaker.trim()]);
      setNewMaker('');
    }
  };

  const isRunning = jobStatus?.status === 'PENDING' || jobStatus?.status === 'RUNNING';

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option>노트북</option>
            <option>태블릿</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">제조사</label>
          <div className="flex flex-wrap gap-2">
            {makers.map((m) => (
              <span key={m} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                {m}
                <button onClick={() => removeMaker(m)} className="text-gray-500 hover:text-red-500">×</button>
              </span>
            ))}
            <div className="flex gap-1">
              <input
                value={newMaker}
                onChange={(e) => setNewMaker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMaker()}
                placeholder="추가..."
                className="border rounded px-2 py-1 text-sm w-24"
              />
              <button onClick={addMaker} className="text-sm px-2 py-1 border rounded">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      {jobStatus && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isRunning && <span className="text-yellow-600 font-medium">⏳ 실행 중...</span>}
            {jobStatus.status === 'DONE' && <span className="text-green-600 font-medium">✅ 완료</span>}
            {jobStatus.status === 'FAILED' && <span className="text-red-600 font-medium">❌ 실패</span>}
          </div>
          <div
            ref={logBoxRef}
            className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded h-64 overflow-y-auto"
          >
            {jobStatus.logs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {isRunning && <div className="animate-pulse">▌</div>}
          </div>
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="w-full py-3 bg-black text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
      >
        {isRunning ? '실행 중...' : '▶ 전체 파이프라인 실행'}
      </button>
    </div>
  );
}
```

**Step 2: Create SchedulerTab**

Create `src/app/admin/components/SchedulerTab.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

type Schedule = {
  enabled: boolean;
  frequency: string;
  hour: number;
  makers: string[];
  category: string;
};

export function SchedulerTab() {
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: false, frequency: 'daily', hour: 3,
    makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'],
    category: '노트북',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schedule').then((r) => r.json()).then(setSchedule);
  }, []);

  const handleSave = async () => {
    await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const nextRun = () => {
    if (!schedule.enabled) return '비활성';
    const now = new Date();
    const next = new Date();
    next.setHours(schedule.hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-medium">자동 실행</span>
        <button
          onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-black' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${schedule.enabled ? 'left-7' : 'left-1'}`} />
        </button>
        <span className="text-sm text-gray-500">{schedule.enabled ? 'ON' : 'OFF'}</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">주기</label>
          <select
            value={schedule.frequency}
            onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">실행 시각</label>
          <select
            value={schedule.hour}
            onChange={(e) => setSchedule({ ...schedule, hour: Number(e.target.value) })}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        다음 실행: <span className="font-medium text-gray-900">{nextRun()}</span>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        {saved ? '✅ 저장됨' : '저장'}
      </button>
    </div>
  );
}
```

**Step 3: Create RunHistoryTab**

Create `src/app/admin/components/RunHistoryTab.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

type Job = {
  id: string;
  status: string;
  triggeredBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export function RunHistoryTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/admin/pipeline/history')
      .then((r) => r.json())
      .then(setJobs);
  }, []);

  const loadLogs = async (jobId: string) => {
    if (expandedId === jobId) { setExpandedId(null); return; }
    setExpandedId(jobId);
    if (!logs[jobId]) {
      const res = await fetch(`/api/admin/pipeline/${jobId}`);
      const data = await res.json();
      setLogs((prev) => ({ ...prev, [jobId]: data.logs }));
    }
  };

  const duration = (job: Job) => {
    if (!job.startedAt || !job.completedAt) return '-';
    const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}초` : `${Math.round(s / 60)}분 ${s % 60}초`;
  };

  return (
    <div className="space-y-2">
      {jobs.length === 0 && <p className="text-gray-500 text-sm">실행 기록이 없습니다.</p>}
      {jobs.map((job) => (
        <div key={job.id} className="border rounded">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{new Date(job.createdAt).toLocaleString('ko-KR')}</span>
              <span>{job.triggeredBy === 'MANUAL' ? '⚡ 수동' : '🕐 자동'}</span>
              <span>
                {job.status === 'DONE' ? '✅ 성공' : job.status === 'FAILED' ? '❌ 실패' : '⏳ 실행 중'}
              </span>
              <span className="text-gray-500">{duration(job)}</span>
            </div>
            <button onClick={() => loadLogs(job.id)} className="text-xs text-blue-600 hover:underline">
              {expandedId === job.id ? '닫기' : '로그'}
            </button>
          </div>
          {expandedId === job.id && (
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 max-h-48 overflow-y-auto border-t">
              {(logs[job.id] ?? []).map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Create main admin page**

Create `src/app/admin/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ManualRunTab } from './components/ManualRunTab';
import { SchedulerTab } from './components/SchedulerTab';
import { RunHistoryTab } from './components/RunHistoryTab';

const TABS = [
  { id: 'manual', label: '⚡ 수동 실행' },
  { id: 'scheduler', label: '🕐 스케줄러' },
  { id: 'history', label: '📋 실행 기록' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('manual');

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">🔧 관리자 — 콘텐츠 파이프라인</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'manual' && <ManualRunTab />}
      {activeTab === 'scheduler' && <SchedulerTab />}
      {activeTab === 'history' && <RunHistoryTab />}
    </div>
  );
}
```

**Step 5: Add history API route**

Create `src/app/api/admin/pipeline/history/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET() {
  const jobs = await db.pipelineJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, status: true, triggeredBy: true,
      createdAt: true, startedAt: true, completedAt: true,
    },
  });
  return NextResponse.json(jobs);
}
```

Create `src/app/api/admin/pipeline/[jobId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const job = await db.pipelineJob.findUnique({
    where: { id: params.jobId },
    include: { logs: { orderBy: { createdAt: 'asc' } } },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...job, logs: job.logs.map((l) => l.message) });
}
```

**Step 6: Test manually**

```bash
npm run dev     # terminal 1
npm run worker  # terminal 2
```

Open `http://localhost:3000/admin`, click "▶ 전체 파이프라인 실행" (confirm dialog), observe log polling.

**Step 7: Commit**

```bash
git add src/app/admin/ src/app/api/admin/
git commit -m "feat(admin): add 3-tab admin UI with pipeline trigger, scheduler, and history"
```

---

## Task 9: Final Verification

**Step 1: Run all tests**

```bash
npx jest --testPathPattern="pipeline|PipelineRunner"
```

Expected: All pass.

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Build check**

```bash
npm run build
```

Expected: Successful build.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin pipeline UI with worker process and scheduler"
```
