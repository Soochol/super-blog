# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 product comparison blog (laptop-focused) that crawls manufacturer specs, gathers web reviews, generates AI-powered critique articles, and monetizes through Coupang affiliate links. Korean-language content targeting Korean consumers.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Run all tests:** `npx jest`
- **Run single test:** `npx jest tests/domains/category/domain/CategoryRule.test.ts`
- **Run tests matching pattern:** `npx jest --testPathPattern="product"`
- **Prisma generate:** `npx prisma generate`

## Architecture

Hexagonal (Ports & Adapters) architecture with DDD, organized under `src/domains/` and `src/infrastructure/`.

### Domain Layer (`src/domains/`)

Each domain has `domain/` (entities, value objects, pure functions) and optional `application/` (services orchestrating ports). Domains communicate through ports (interfaces), never directly importing infrastructure.

| Domain | Purpose |
|---|---|
| **product** | `ProductSpecs`, `CrawlHistory`, `WebReviewReference`. Ports: `Crawler`, `SpecExtractor`. Application: `ProductGatheringService` orchestrates crawl → extract pipeline |
| **content** | `ProductReview`, `ProductStrategy`, `SentimentAnalysis`. Port: `ContentGenerator`. Application: `CritiqueWritingService` orchestrates sentiment → strategy → article pipeline |
| **category** | `CategoryRule` with rule-based product filtering (`isEligibleForCategory`). Port: `CategoryManager` |
| **affiliate** | `AffiliateLink` with `ProviderType` (COUPANG/AMAZON/ELEVENST). Port: `AffiliateProvider` with AI price validation |
| **publishing** | `SeoRoute`, `SeoMetadata`. Port: `Publisher` for sitemap/indexing |
| **analytics** | `TrackingEvent` for CTA click tracking. Port: `AnalyticsTracker` |
| **skill** | `AiSkill` — versioned prompt templates with `injectContextToPrompt` for template variable substitution |

### Components Layer (`src/components/`)

React UI/presentation components, separated from domain logic:
- `product/ProductCard`, `product/ProductSpecTable` — Product display components
- `monetization/BuyButtonCTA` — Affiliate CTA button (client component)
- `layout/Header`, `layout/Footer` — Shared layout components

### Infrastructure Layer (`src/infrastructure/`)

Concrete implementations of domain ports:
- `ai/AiSpecExtractor` — Uses Vercel AI SDK with Google Gemini for structured data extraction from HTML
- `crawler/PlaywrightCrawler` — Headless browser crawling with resource blocking
- `affiliate/CoupangProvider` — Coupang Partners API with HMAC-SHA256 auth
- `events/NodeEventBus` — Node.js EventEmitter-based domain event bus (implements `EventBus` port). Supports typed events via `DomainEventMap`, configurable error handler, async handler tracking with graceful `shutdown()`, and `setMaxListeners`
- `events/globalEventBus` — Global singleton (cached on `globalThis`) for app-wide event bus access
- `db/PrismaClient` — PostgreSQL via Prisma ORM

### Shared Layer (`src/shared/`)

- `events/DomainEvent` — Generic event envelope (`eventId`, `correlationId`, `aggregateId`, `aggregateType`, `payload<T>`)
- `events/DomainEvents` — Typed event registry (`DomainEventMap`), payload interfaces, and `createDomainEvent()` factory. New events: add payload interface + key to `DomainEventMap`
- `events/EventBus` — Event bus port interface (`publish`, `subscribe` → `Unsubscribe`, `shutdown`)
- `ai/ports/AiClient` — Common AI interface (`generateStructuredData<T>`, `validateMatch`) used across domains

### Data Layer (`src/lib/api.ts`, `src/data/`)

Currently backed by static JSON files (`categories.json`, `products.json`, `reviews.json`). The Prisma schema defines the target DB structure. Migration from JSON to Prisma is planned.

### Frontend (`src/app/`)

Next.js App Router with dynamic routes:
- `/` — Home page
- `/[categoryId]` — Category listing
- `/[categoryId]/[productId]` — Product detail
- `/[categoryId]/compare/[ids]` — Product comparison

## Key Patterns

- **Path alias:** `@/*` maps to `src/*`
- **Port interfaces** are in `domain/ports/` directories — always define new external dependencies as ports first
- **Domain functions are pure** (e.g., `isGamingLaptop`, `isEligibleForCategory`, `createAffiliateLink`) — keep them testable without mocks
- **AI integration** uses Vercel AI SDK (`ai` package) with `generateObject` for structured outputs validated by Zod schemas
- **Test structure** mirrors source: `tests/domains/` and `tests/infrastructure/` parallel `src/domains/` and `src/infrastructure/`
- **Cross-domain imports:** Domain code can import types from other domains (e.g., `content` imports `ProductSpecs` from `product`) but never imports infrastructure
- **Domain events:** Use `createDomainEvent()` from `shared/events/DomainEvents` to create typed events. Propagate `correlationId` from parent event when publishing follow-up events. Error handling types (`EventErrorContext`, `EventErrorHandler`) live in the adapter (`NodeEventBus`), not the port

## Tech Stack

- Next.js 16, React 19, TypeScript (strict)
- Prisma 7 with PostgreSQL
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`)
- Tailwind CSS 4
- Jest 30 with ts-jest
- Playwright (crawling, not E2E tests)
- Zod 4 for schema validation
