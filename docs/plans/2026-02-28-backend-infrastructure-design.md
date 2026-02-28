# Backend Infrastructure Design

## Overview
This document outlines the infrastructure choices and implementation design for the backend of the Super Blog MVP. It builds upon the previously defined Domain-Driven Design (DDD) architecture by specifying the exact technologies (Adapters) that will implement the Domain Ports (Interfaces).

## Architecture & Technology Stack

### 1. Database & Persistence Layer (Repository Adapters)
*   **Technology:** PostgreSQL + Prisma ORM
*   **Why:** 
    *   Prisma's declarative schema definition (`schema.prisma`) aligns perfectly with DDD entities (e.g., `ProductSpecs`, `Review`, `Category`).
    *   Provides excellent TypeScript auto-completion and type safety, preventing mismatches between the database structure and domain logic.
    *   Widely used in the Next.js ecosystem, making it the safest choice for Server Components and Route Handlers.
    *   PostgreSQL supports JSONB columns, allowing for flexible storage of unstructured data (like raw crawl HTML or varying product specs) during the MVP phase.

### 2. Data Gathering Layer (Crawler Adapters)
*   **Technology:** Playwright (Node.js)
*   **Why:**
    *   Unlike traditional HTML parsers (like Cheerio), Playwright can execute JavaScript. This is essential for scraping modern Single Page Applications (SPAs) and e-commerce sites (like Coupang or Samsung) where product details or reviews are loaded dynamically.
    *   It will implement the `Crawler` port to fetch both official product specifications and search the web for community reviews.

### 3. AI & Content Generation Layer (AI Adapters)
*   **Technology:** Vercel AI SDK + Gemini 3.1 Pro & Claude 4.6 Sonnet
*   **Why:**
    *   **Vercel AI SDK:** Provides a unified, provider-agnostic interface to easily swap or combine different AI models without rewriting the core prompt logic. It strongly supports structured JSON generation.
    *   **Gemini 3.1 Pro:** Will be utilized for heavy data processing, such as reading large HTML payloads from Playwright to accurately extract structured `ProductSpecs` and summarize web sentiments.
    *   **Claude 4.6 Sonnet:** Will be used for its superior reasoning and writing capabilities. It will take the extracted specs and sentiment analysis to write high-quality, engaging critique articles (`ProductReview`).

### 4. Affiliate Integration Layer (Affiliate Adapters)
*   **Technology:** Coupang Partners API + Node.js Crypto
*   **Why:**
    *   Implements the `AffiliateProvider` port.
    *   Requires generating HMAC signatures using Node's native `crypto` module to securely communicate with the Coupang API for fetching lowest prices and generating deep links.

## Data Flow Example (Gathering & Writing)
1.  **Trigger:** A scheduled Cron job or an API call initiates the process for a specific product URL keyword.
2.  **Crawl:** `PlaywrightCrawler` visits the manufacturer site and community forums, returning `RawProductData`.
3.  **Extract:** Vercel AI SDK via `Gemini 3.1 Pro` processes the raw data, returning structured `ProductSpecs` and `SentimentAnalysis`.
4.  **Write:** Vercel AI SDK via `Claude 4.6 Sonnet` takes the specs and sentiment to generate the final `CritiqueArticle`.
5.  **Persist:** Prisma saves all entities (`Product`, `Review`, `CrawlHistory`) to PostgreSQL.

## Next Steps
Following the `/brainstorm` workflow, the immediate next step is to invoke the `writing-plans` skill to break down this high-level design into a step-by-step TDD implementation plan for the Infrastructure layer.
