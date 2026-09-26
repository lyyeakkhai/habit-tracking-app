# PWA Mobile & Offline Capstone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn HABIT//PULSE into an installable, offline-resilient Progressive Web App with zero horizontal scroll at 320px, prompt-based service worker updates, an offline queue that synchronizes on reconnect, and green Lighthouse scores.

**Architecture:** `vite-plugin-pwa` generates a service worker using Workbox `generateSW` with custom runtime caching rules for static fonts, images, and the Supabase API. Local habit additions when offline are stored in a versioned `localStorage` queue, optimistically displayed, and automatically flushed to Supabase when the `online` event fires. Mobile-first CSS ensures strict 320px viewport compliance without horizontal overflow.

**Tech Stack:** React 19, TypeScript, Vite 8, `vite-plugin-pwa` 1.3, `workbox-window` 7.4, `@supabase/supabase-js`, `lucide-react`, `sharp`.

## Global Constraints

- Do not test service worker or offline capabilities on the Vite dev server (`npm run dev`); always use `npm run build && npm run preview`.
- The import for `useRegisterSW` must be verbatim: `import { useRegisterSW } from 'virtual:pwa-register/react'`.
- The PWA update strategy must be `registerType: 'prompt'`.
- All views must render cleanly with 0px horizontal scroll on 320px viewports (iPhone SE).
- Lighthouse score targets: Accessibility $\ge 95$ (target 100), Best Practices $\ge 95$, SEO $\ge 95$, Performance $\ge 85$.

---

### Task 1: PWA Manifest, Assets & Icon Generation Pipeline

**Files:**
- Create: `scripts/generate-icons.js`
- Create: `public/pwa-64x64.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon.png`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: `public/favicon.svg`
- Produces: PNG icon suite in `public/` in all required sizes with maskable safe-zone padding.

- [ ] **Step 1: Create the icon generation script with Sharp**
Write `scripts/generate-icons.js` to render the SVG into 64x64, 192x192, 512x512 (any), 512x512 (maskable with safe area), and 180x180 (apple-touch-icon).

- [ ] **Step 2: Add `generate-icons` npm script to `package.json`**
```json
"scripts": {
  "generate-icons": "node scripts/generate-icons.js"
}
```

- [ ] **Step 3: Execute icon generation script**
Run: `npm run generate-icons`
Expected: Output `✅ All PWA icons generated successfully in public/!` and all 5 PNG files present in `public/`.

- [ ] **Step 4: Update `index.html` with theme-color and apple-mobile tags**
Ensure `index.html` contains:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
<meta name="theme-color" content="#00e676" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="HABIT//PULSE" />
```

- [ ] **Step 5: Verify build with icon references**
Run: `npm run build`
Expected: Successful compile with icon assets properly resolved.

- [ ] **Step 6: Commit icon pipeline and assets**
```bash
git add scripts/generate-icons.js public/ package.json index.html
git commit -m "feat(pwa): generate PWA icon suite and configure web app manifest tags"
```

---

### Task 2: Service Worker Configuration & `<UpdateToast />` Component

**Files:**
- Create: `src/components/UpdateToast.tsx`
- Modify: `vite.config.ts`
- Modify: `src/App.tsx`
- Modify: `tsconfig.app.json`

**Interfaces:**
- Consumes: `'virtual:pwa-register/react'`
- Produces: `<UpdateToast />` reacting to `needRefresh` and calling `updateServiceWorker(true)`.

- [ ] **Step 1: Ensure TypeScript client types in `tsconfig.app.json`**
Ensure `"types": ["vite-plugin-pwa/react"]` is present in `compilerOptions` of `tsconfig.app.json`.

- [ ] **Step 2: Configure `VitePWA` in `vite.config.ts` with `registerType: 'prompt'`**
Configure `registerType: 'prompt'`, `manifest`, and `workbox.globPatterns` in `vite.config.ts`.

- [ ] **Step 3: Implement `<UpdateToast />` component**
Write `src/components/UpdateToast.tsx` using `useRegisterSW`:
- Displays when `needRefresh === true`.
- Contains "Refresh" button that triggers `updateServiceWorker(true)`.
- Accessible alert role (`role="alert"`).

- [ ] **Step 4: Mount `<UpdateToast />` at the root of `src/App.tsx`**
Mount `<UpdateToast />` outside `<Routes>` in `src/App.tsx`.

- [ ] **Step 5: Verify build & service worker generation**
Run: `npm run build`
Expected: `dist/sw.js` and `dist/workbox-*.js` generated.

- [ ] **Step 6: Commit Service Worker and UpdateToast**
```bash
git add vite.config.ts src/components/UpdateToast.tsx src/App.tsx tsconfig.app.json
git commit -m "feat(pwa): configure prompt-based service worker registration and UpdateToast"
```

---

### Task 3: Workbox Runtime Caching Strategies & Defense

**Files:**
- Modify: `vite.config.ts`
- Create: `docs/CACHING_STRATEGY.md`

**Interfaces:**
- Consumes: Workbox runtime caching options
- Produces: Verified runtime rules for Google Fonts, static images, and Supabase REST API.

- [ ] **Step 1: Configure Workbox `runtimeCaching` array in `vite.config.ts`**
Define rules for:
1. `google-fonts-stylesheets` (`StaleWhileRevalidate`)
2. `google-fonts-webfonts` (`CacheFirst`)
3. `images-cache` (`CacheFirst`)
4. `supabase-api-cache` (`NetworkFirst` with `networkTimeoutSeconds: 3`)

- [ ] **Step 2: Document one-sentence defense per caching rule**
Write `docs/CACHING_STRATEGY.md` containing the rationale for each rule.

- [ ] **Step 3: Run production build to verify caching rules in compiled service worker**
Run: `npm run build`
Inspect: Check that `dist/sw.js` registers the runtime route handlers for fonts, images, and API.

- [ ] **Step 4: Commit caching configurations and documentation**
```bash
git add vite.config.ts docs/CACHING_STRATEGY.md
git commit -m "feat(pwa): configure and document Workbox runtime caching rules"
```

---

### Task 4: Offline Status, Queueing & Auto-Sync on Reconnect

**Files:**
- Create: `src/hooks/useNetworkStatus.ts`
- Create: `src/components/OfflineBanner.tsx`
- Modify: `src/types/habit.ts`
- Modify: `src/pages/TrackerPage.tsx`

**Interfaces:**
- Consumes: `window.addEventListener('online')` / `'offline'`, `supabase.from('habits').insert`
- Produces: `isOnline`, `queuedCount`, `enqueueHabit()`, `<OfflineBanner />` with real-time sync notification.

- [ ] **Step 1: Add `is_queued?: boolean` to `HabitWithStatus` in `src/types/habit.ts`**
Update TypeScript interface so queued habits can be typed.

- [ ] **Step 2: Implement `useNetworkStatus` hook**
Write `src/hooks/useNetworkStatus.ts`:
- Tracks online/offline events.
- Queues habits in `localStorage` under `habit_offline_queue_v1`.
- Automatically executes `syncQueuedHabits()` when `online` fires.

- [ ] **Step 3: Implement `<OfflineBanner />` component**
Write `src/components/OfflineBanner.tsx`:
- Amber warning when offline with count of locally queued habits.
- Blue syncing message when restoring connection.
- Emerald green confirmation when sync completes.

- [ ] **Step 4: Integrate offline queue and banner in `TrackerPage.tsx`**
- Show `<OfflineBanner />` at top of `TrackerPage`.
- Intercept habit additions when `!isOnline` and save via `enqueueHabit()`.
- Optimistically display queued habits with an amber "Queued Offline" badge.

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Compiles with 0 TypeScript or bundling errors.

- [ ] **Step 6: Commit offline queue and banner**
```bash
git add src/types/habit.ts src/hooks/useNetworkStatus.ts src/components/OfflineBanner.tsx src/pages/TrackerPage.tsx
git commit -m "feat(offline): add offline banner and localStorage habit queue with reconnect sync"
```

---

### Task 5: Mobile-First Responsive Pass (320px Zero Horizontal Scroll) & Share Button

**Files:**
- Create: `src/components/ShareButton.tsx`
- Create: `src/components/InstallPwaButton.tsx`
- Modify: `src/App.css`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/HabitCard.tsx`
- Modify: `src/pages/TrackerPage.tsx`

**Interfaces:**
- Consumes: `navigator.share` / `navigator.clipboard.writeText`, CSS media queries
- Produces: 320px-compliant mobile-first layout with native Share button and Install button.

- [ ] **Step 1: Implement `<ShareButton />` with clipboard fallback**
Write `src/components/ShareButton.tsx` supporting Web Share API and `navigator.clipboard.writeText` fallback with "Copied!" feedback.

- [ ] **Step 2: Implement `<InstallPwaButton />`**
Write `src/components/InstallPwaButton.tsx` capturing `beforeinstallprompt` and suppressing display in `standalone` mode.

- [ ] **Step 3: Update `src/App.css` with responsive grid and 320px safeguards**
- Add `.habits-grid` with `grid-template-columns: repeat(1, minmax(0, 1fr))` on mobile, `repeat(2, minmax(0, 1fr))` at $\ge 640px$, and `repeat(3, minmax(0, 1fr))` at $\ge 1024px$.
- Set `min-width: 320px`, `box-sizing: border-box`, and prevent text overflow across user pills, badges, and habit cards.

- [ ] **Step 4: Integrate buttons into `Navbar.tsx` and `HabitCard.tsx`**
- Mount `<InstallPwaButton />` and `<ShareButton />` in `Navbar.tsx`.
- Add individual habit share button to `HabitCard.tsx`.

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Pass without errors.

- [ ] **Step 6: Commit mobile-first updates and Share button**
```bash
git add src/components/ShareButton.tsx src/components/InstallPwaButton.tsx src/App.css src/components/Navbar.tsx src/components/HabitCard.tsx src/pages/TrackerPage.tsx
git commit -m "feat(mobile): enforce zero horizontal scroll at 320px and add native share integration"
```

---

### Task 6: Production Build Verification, Lighthouse Audit & Deliverables Document

**Files:**
- Create: `docs/PWA_CAPSTONE_DELIVERABLES.md`
- Verify: `lighthouse-report.report.json`
- Verify: `lighthouse-report.report.html`

**Interfaces:**
- Consumes: Production build `dist/`
- Produces: Comprehensive deliverables document with caching defense, Lighthouse score cards, audit verification checklist, and links.

- [ ] **Step 1: Run production build and test preview**
Run: `npm run build`
Verify `dist/` contains all manifest icons, `sw.js`, and hashed bundles.

- [ ] **Step 2: Verify Lighthouse audit scores**
Extract and verify category scores:
- Performance $\ge 85$
- Accessibility $\ge 95$
- Best Practices $\ge 95$
- SEO $\ge 95$

- [ ] **Step 3: Write comprehensive `docs/PWA_CAPSTONE_DELIVERABLES.md`**
Document:
1. GitHub repo link & preview command
2. One-sentence defense for all 5 caching rules
3. Step-by-step verification checklist (offline mode, queue & sync, 320px layout, update toast)
4. Lighthouse before/after audit scores table

- [ ] **Step 4: Commit deliverables document**
```bash
git add docs/PWA_CAPSTONE_DELIVERABLES.md
git commit -m "docs: finalize PWA capstone deliverables, audit verification, and caching defense"
```
