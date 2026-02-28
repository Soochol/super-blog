# Backend Infrastructure Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the Infrastructure Layer (Adapters) for the backend DDD architecture using Prisma, Playwright, and Vercel AI SDK.

**Architecture:** We will implement the concrete classes that satisfy the Ports defined in the Domain layer (`Crawler`, `SpecExtractor`, `ContentGenerator`, `AffiliateProvider`, `AnalyticsTracker`). We will also set up Prisma ORM to satisfy persistence needs and implement a simple Domain Event Publisher.

**Tech Stack:** TypeScript, Jest, Prisma, Playwright, Vercel AI SDK (@ai-sdk/google, @ai-sdk/anthropic), Coupang Partners API

---

### Task 1: Setup Prisma ORM and Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (add dependencies)
- Create: `src/infrastructure/db/PrismaClient.ts`

**Step 1: Install Dependencies**
Run: `npm install @prisma/client`
Run: `npm install -D prisma`
Run: `npx prisma init`

**Step 2: Define Prisma Schema**
Modify: `prisma/schema.prisma` to include models for `Product`, `Review`, `Category`, `EventLog`, `SkillConfig`.

**Step 3: Create Prisma Client Singleton**
Create: `src/infrastructure/db/PrismaClient.ts` to export a shared Prisma instance.

**Step 4: Commit**
```bash
git add prisma/ package.json package-lock.json src/infrastructure/db/PrismaClient.ts
git commit -m "chore(db): setup prisma orm and initial schema"
```

---

### Task 2: Implement Web Crawler Adapter (Playwright)

**Files:**
- Create: `src/infrastructure/crawler/PlaywrightCrawler.ts`
- Test: `tests/infrastructure/crawler/PlaywrightCrawler.test.ts`

**Step 1: Write the failing test**
Create a test that instantiates `PlaywrightCrawler` and calls `crawlExistingProduct` on a mock/sample URL.

**Step 2: Run test to verify it fails**
Run: `npx jest tests/infrastructure/crawler/PlaywrightCrawler.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Implementation using `playwright-core` (or `playwright`) to launch a browser, extract HTML, and return `RawProductData`.
Run: `npm install -D playwright` before implementing.

**Step 4: Run test to verify it passes**
Run: `npx jest tests/infrastructure/crawler/PlaywrightCrawler.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json package-lock.json src/infrastructure/crawler tests/infrastructure/crawler
git commit -m "feat(infrastructure): implement playwright web crawler adapter"
```

---

### Task 3: Implement AI Adapters (Vercel AI SDK)

**Files:**
- Create: `src/infrastructure/ai/VercelAiClient.ts`
- Create: `src/infrastructure/ai/AiSpecExtractor.ts` (Implements `SpecExtractor`)
- Create: `src/infrastructure/ai/AiContentGenerator.ts` (Implements `ContentGenerator`)
- Test: `tests/infrastructure/ai/AiAdapters.test.ts`

**Step 1: Write the failing test**
Create a test mocking `generateObject` and `generateText` from the Vercel AI SDK to verify the extractors format data correctly.

**Step 2: Run test to verify it fails**
Run: `npx jest tests/infrastructure/ai/AiAdapters.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Install dependencies: `npm install ai @ai-sdk/google @ai-sdk/anthropic zod`
Implement the classes using Gemini for extraction and Claude for writing.

**Step 4: Run test to verify it passes**
Run: `npx jest tests/infrastructure/ai/AiAdapters.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json package-lock.json src/infrastructure/ai tests/infrastructure/ai
git commit -m "feat(infrastructure): implement ai adapters using vercel sdk"
```

---

### Task 4: Implement Affiliate Provider Adapter (Coupang)

**Files:**
- Create: `src/infrastructure/affiliate/CoupangProvider.ts`
- Test: `tests/infrastructure/affiliate/CoupangProvider.test.ts`

**Step 1: Write the failing test**
Create a test verifying the HMAC signature generation logic for the Coupang API.

**Step 2: Run test to verify it fails**
Run: `npx jest tests/infrastructure/affiliate/CoupangProvider.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Use native Node `crypto` to generate the correct API headers and implement the interface methods.

**Step 4: Run test to verify it passes**
Run: `npx jest tests/infrastructure/affiliate/CoupangProvider.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/infrastructure/affiliate tests/infrastructure/affiliate
git commit -m "feat(infrastructure): implement coupang affiliate api adapter"
```

---

### Task 5: Implement Simple Event Bus (Node EventEmitter)

**Files:**
- Create: `src/infrastructure/events/NodeEventBus.ts`
- Test: `tests/infrastructure/events/NodeEventBus.test.ts`

**Step 1: Write the failing test**
Test that an event published is correctly received by a subscriber.

**Step 2: Run test to verify it fails**
Run: `npx jest tests/infrastructure/events/NodeEventBus.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
Wrap standard Node.js `EventEmitter` to create a simple pub/sub system for Domain Events.

**Step 4: Run test to verify it passes**
Run: `npx jest tests/infrastructure/events/NodeEventBus.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/infrastructure/events tests/infrastructure/events
git commit -m "feat(infrastructure): implement node event bus for domain events"
```
