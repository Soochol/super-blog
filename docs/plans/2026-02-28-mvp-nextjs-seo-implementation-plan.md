# Next.js SEO MVP Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build the Next.js frontend MVP with dummy data to verify SSG/ISR routing and SEO metadata generation for the Super Blog platform.

**Architecture:** A Next.js App Router project using Tailwind CSS. Data is provided via static JSON files. Pages (`/`, `/[categoryId]`, `/[categoryId]/[productId]`, `/[categoryId]/compare/[ids]`) are statically generated at build time using `generateStaticParams`. Metadata is dynamically generated for SEO. FSD-lite architecture is used for components (`src/domains`).

**Tech Stack:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Lucide React (for icons)

---

### Task 1: Initialize Project & Setup

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tailwind.config.ts` (via create-next-app)

**Step 1: Create Next.js App**
Run: `npx -y create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
Expected: Framework initialization completes successfully in the current directory.

**Step 2: Install additional dependencies**
Run: `npm install lucide-react`
Expected: Icons library installed.

**Step 3: Commit**
```bash
git add .
git commit -m "chore: initialize next.js app router project with tailwind"
```

---

### Task 2: Create Dummy Data

**Files:**
- Create: `src/data/categories.json`
- Create: `src/data/products.json`
- Create: `src/data/reviews.json`
- Create: `src/types/index.ts`
- Create: `src/lib/api.ts`

**Step 1: Define Types (`src/types/index.ts`)**
```typescript
export interface Category { id: string; name: string; description: string; }
export interface ProductSpec { cpu: string; ram: string; storage: string; gpu: string; display: string; weight: number; os: string; }
export interface Product { id: string; categoryId: string; name: string; price: number; brand: string; specs: ProductSpec; imageUrl: string; couponUrl?: string; }
export interface Review { productId: string; summary: string; pros: string[]; cons: string[]; rating: number; }
```

**Step 2: Create JSON Data**
Populate the json files in `src/data/` with dummy laptop data (e.g. macbook-pro-16, galaxy-book-4-pro, rog-strix-g16).

**Step 3: Create Data Fetcher (`src/lib/api.ts`)**
Create functions to mock DB calls using the JSON files:
`getCategories()`, `getCategoryData(id)`, `getProductsByCategory(id)`, `getProductById(id)`, `getReviewByProductId(id)`.

**Step 4: Commit**
```bash
git add src/data/ src/types/ src/lib/api.ts
git commit -m "feat: setup dummy data and api utilities"
```

---

### Task 3: Global Layout & Shared Components

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/domains/ui/Header.tsx`
- Create: `src/domains/ui/Footer.tsx`

**Step 1: Build Header & Footer**
Implement simple sticky Header with navigation link to `/laptop`, and Footer with Coupang disclaimer.

**Step 2: Apply to Layout**
Update `src/app/layout.tsx` to include `Header` and `Footer` surrounding `{children}`. Set default base SEO metadata.

**Step 3: Test Layout Compilation**
Run: `npm run build`
Expected: Build passes without type/lint errors.

**Step 4: Commit**
```bash
git add src/app/ src/domains/ui/
git commit -m "feat: implement global layout, header, and footer"
```

---

### Task 4: Product Domain Components

**Files:**
- Create: `src/domains/product/ProductCard.tsx`
- Create: `src/domains/product/ProductSpecTable.tsx`
- Create: `src/domains/monetization/BuyButtonCTA.tsx`

**Step 1: Implement BuyButtonCTA**
Create an eye-catching button accepting `url` and `price`. 

**Step 2: Implement ProductCard**
Create a grid card showing image, title, price, highlighted specs (cpu/ram/gpu) and the `BuyButtonCTA`. Use `next/link` for detail page navigation.

**Step 3: Implement ProductSpecTable**
Create a table component that can accept one or two products to render side-by-side spec comparison.

**Step 4: Test Compilation**
Run: `npm run build`
Expected: Build passes.

**Step 5: Commit**
```bash
git add src/domains/product/ src/domains/monetization/
git commit -m "feat: create product UI components"
```

---

### Task 5: Pages & Dynamic Routing (SSG)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/[categoryId]/page.tsx`
- Create: `src/app/[categoryId]/[productId]/page.tsx`
- Create: `src/app/[categoryId]/compare/[ids]/page.tsx`

**Step 1: Implement Home Page (`app/page.tsx`)**
Show list of categories.

**Step 2: Implement Category Page (`[categoryId]/page.tsx`)**
Use `generateStaticParams()` to pre-render route based on `categories.json`. Render grid of `ProductCard`s.

**Step 3: Implement Detail Page (`[categoryId]/[productId]/page.tsx`)**
Use `generateStaticParams()` to pre-render routes based on `products.json`. Fetch product & review, display them along with `ProductSpecTable` and `BuyButtonCTA`. Add dynamic `generateMetadata()`.

**Step 4: Implement Compare Page (`[categoryId]/compare/[ids]/page.tsx`)**
Use `generateStaticParams()` to pre-calculate combinations (A-vs-B). Parse `[ids]`, fetch both products, and render side-by-side using `ProductSpecTable`. Add dynamic `generateMetadata()`.

**Step 5: Test Full SSG Build**
Run: `npm run build`
Expected: Output shows all dynamic routes (`/laptop/macbook-pro-16`, etc.) generated statically `(○  (Static)  automatically rendered as static HTML)`

**Step 6: Commit**
```bash
git add src/app/
git commit -m "feat: implement SSG routing and SEO pages"
```
