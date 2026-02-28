# Frontend Neo-Brutalism Styling Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Apply the approved Neo-Brutalism design system (bold borders, high contrast, hard drop shadows, primary colors) to the existing MVP Next.js project.

**Architecture:** Update Tailwind configuration for design tokens, then systematically refactor UI components and pages to consume these new tokens and apply physical-feeling hover interactions.

**Tech Stack:** Next.js App Router, Tailwind CSS, Lucide React

---

### Task 1: Setup Neo-Brutalism Tailwind Theme

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Update Tailwind Config**
Add custom colors (primary accents), box shadows (hard shadows), and configure fonts if necessary.

**Step 2: Update CSS reset/variables**
Ensure `globals.css` applies the base off-white background (`#FDFBF7`) and sets text default color to black (`#000000`). Make sure `body` has the new background color.

---

### Task 2: Refactor Global Components (Header & Footer)

**Files:**
- Modify: `src/domains/ui/Header.tsx`
- Modify: `src/domains/ui/Footer.tsx`

**Step 1: Header**
Apply bold bottom border (`border-b-4 border-black`), update navigation links to use bold typography, and style the search bar with thick borders and hard shadows on focus.

**Step 2: Footer**
Apply bold top border (`border-t-4 border-black`), use contrasting background colors for different sections, and bold typography for headings. Add a Neo-Brutalism styling to the Coupang disclaimer box.

---

### Task 3: Refactor Monetization Components (BuyButtonCTA)

**Files:**
- Modify: `src/domains/monetization/BuyButtonCTA.tsx`

**Step 1: Refactor BuyButtonCTA base styles**
Replace soft shadows with hard box-shadows (`shadow-[4px_4px_0px_#000000]`).
Set `border-2` or `border-4` solid black.
Update hover effects: translate button slightly and reduce shadow to simulate physical pressing (`active:translate-y-1 active:translate-x-1 active:shadow-none`).
Update variant colors to vibrant primaries (Neon Pink, Coupang Orange).

---

### Task 4: Refactor Product Domain Components

**Files:**
- Modify: `src/domains/product/ProductCard.tsx`
- Modify: `src/domains/product/ProductSpecTable.tsx`

**Step 1: ProductCard**
Update card container to have `border-4 border-black` and `shadow-[6px_6px_0px_#000000]`.
Ensure hover translates the card and adjusts shadow. 
Style the brand badge and ranking badge with vibrant block colors and thick borders.

**Step 2: ProductSpecTable**
Update table borders to thick black. 
Style the table header background with a bright primary color (e.g., Yellow or Cyan).
Ensure rows have solid bottom borders rather than subtle grays.

---

### Task 5: Refactor Pages (Home & Others)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/[categoryId]/page.tsx`
- Modify: `src/app/[categoryId]/[productId]/page.tsx`

**Step 1: Home Page Hero & Categories**
Refactor the Hero section to use a massive, bold font and a vibrant background block (e.g., `#FFEB3B`). 
Refactor category quick links into pill-shaped buttons with hard shadows.

**Step 2: Page Backgrounds & Typography**
Ensure other pages (Category list, Detail view) adopt the bold typography and hard-edged containers. Remove any soft rounded corners that look too modern/delicate (`rounded-2xl` -> `rounded-none` or `rounded-box` with thick borders).

---

### Task 6: Final Verification

**Step 1: Build & Start**
Run `npm run build` to verify TypeScript and SSG routes pass.
Check for any visual regressions or contrast issues manually if possible, or ensure it compiles cleanly.
