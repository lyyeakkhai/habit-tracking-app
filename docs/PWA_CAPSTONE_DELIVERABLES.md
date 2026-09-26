# HABIT//PULSE: PWA Mobile & Offline Capstone Deliverables

## 1. Project Information & Repository Links

- **GitHub Repository**: [https://github.com/lyyeakkhai/habit-tracking-app.git](https://github.com/lyyeakkhai/habit-tracking-app.git)
- **Active Branch**: `main`
- **Production Build & Preview Command**:
  ```bash
  npm run build && npm run preview
  ```
- **Local Dev Server** (Feature development only):
  ```bash
  npm run dev
  ```
  *(Note: Service Worker and PWA offline capabilities require testing against production output via `npm run build && npm run preview`)*

---

## 2. Deliverable Screenshots Gallery

| Deliverable | Description | File Path |
| :--- | :--- | :--- |
| **1. Install Prompt** | Native browser installation prompt & macOS Safari install guide modal centered at page root. | [`docs/screenshots/1-install-prompt.png`](screenshots/1-install-prompt.png) |
| **2. App Loading Offline in DevTools** | Chrome DevTools Network throttling set to Offline, assets served with 200 via `(ServiceWorker)`, sticky amber offline banner, and optimistic `"Queued Offline"` habit badge. | [`docs/screenshots/2-offline-devtools.png`](screenshots/2-offline-devtools.png) |
| **3. Phone-Width Layout** | Tested on 320px viewport (iPhone SE emulation) with 0px horizontal scroll, single-column responsive habit grid, and $\ge 44\text{px}$ touch targets. | [`docs/screenshots/3-phone-layout-320px.png`](screenshots/3-phone-layout-320px.png) |
| **4. Lighthouse Scores** | Mobile audit scorecard: **100 Accessibility**, **100 Best Practices**, **100 SEO**, and **89 Performance** (0 ms TBT, 0.000 CLS). | [`docs/screenshots/4-lighthouse-scores.png`](screenshots/4-lighthouse-scores.png) |

---

## 3. Workbox Runtime Caching Strategy & Defenses

HABIT//PULSE combines compile-time precaching with targeted runtime caching rules configured via `vite-plugin-pwa` and Google Workbox.

### Caching Strategy Matrix

| Asset Group | Cache Name | URL / File Pattern | Workbox Strategy | Expiration & Limits | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **App Shell** | *Workbox Precache* | `**/*.{js,css,html,svg,png,ico,woff,woff2}` | **Precache & Route** | Revision-hashed per build | 200 |
| **Font Stylesheets** | `google-fonts-stylesheets` | `^https://fonts.googleapis.com/.*` | **StaleWhileRevalidate** | Max 10 entries, 365 days | 0, 200 |
| **Webfonts Binaries** | `google-fonts-webfonts` | `^https://fonts.gstatic.com/.*` | **CacheFirst** | Max 30 entries, 365 days | 0, 200 |
| **Static Images & Avatars** | `images-cache` | `\.(?:png\|jpg\|jpeg\|svg\|gif\|webp\|avif)$` | **CacheFirst** | Max 60 entries, 30 days | 0, 200 |
| **Supabase PostgREST API** | `supabase-api-cache` | `^https://.*\.supabase\.co/rest/v1/.*` | **NetworkFirst** (`timeout: 3s`) | Max 100 entries, 24 hours | 0, 200 |

### One-Sentence Architectural Defenses

1. **Precached App Shell (`precacheAndRoute`)**:
   > *The core HTML shell and hashed build bundles are fixed at compile time and essential for booting the app, so precaching them upon service worker installation guarantees instant offline startup and zero-latency repeat visits.*

2. **Google Fonts Stylesheets (`google-fonts-stylesheets`)**:
   > *Serving font stylesheets from cache ensures zero render-blocking delay on repeat loads while allowing background network revalidation to capture any upstream typography updates from Google's CDN.*

3. **Google Fonts Webfonts (`google-fonts-webfonts`)**:
   > *Font binary files are content-hashed and immutable, making it safe to serve them directly from local cache for up to a year without incurring redundant cellular network overhead.*

4. **Static Images & Avatars (`images-cache`)**:
   > *Static graphic assets and avatars rarely mutate and consume precious mobile bandwidth, so serving them directly from cache ensures snappy visual rendering and minimizes cellular data usage.*

5. **Supabase PostgREST API (`supabase-api-cache`)**:
   > *Habit and streak data must reflect real-time progress whenever connected, but falling back to cached responses after a 3-second timeout prevents cellular Lie-Fi lockup and preserves instant offline access to recent habits.*

---

## 4. Lighthouse Mobile Audit Verification & Score Cards

Lighthouse mobile audits were executed against the production build preview (`http://127.0.0.1:4173/`) under simulated mobile throttling (Moto G Power, simulated 4G / CPU slow-down).

### Category Scores vs Requirements

| Category | Capstone Target | Actual Score | Audit Verdict |
| :--- | :---: | :---: | :---: |
| **Accessibility** | $\ge 95$ | **100** | **PASSED (Perfect Score)** |
| **Best Practices** | $\ge 95$ | **100** | **PASSED (Perfect Score)** |
| **SEO** | $\ge 95$ | **100** | **PASSED (Perfect Score)** |
| **Performance** | $\ge 85$ | **89** | **PASSED (Target Exceeded)** |

### Core Web Vitals & Diagnostic Metrics

| Metric | Measured Value | Score | Target / Industry Benchmark |
| :--- | :---: | :---: | :--- |
| **First Contentful Paint (FCP)** | `2.7 s` | `60` | Fast paint across low-tier mobile networks |
| **Speed Index (SI)** | `2.7 s` | `96` | Quick visual stabilization |
| **Largest Contentful Paint (LCP)** | `3.2 s` | `74` | Main Cyber-Zen dashboard content rendered |
| **Total Blocking Time (TBT)** | `0 ms` | `100` | **Zero main-thread blocking; immediate interactivity** |
| **Cumulative Layout Shift (CLS)** | `0.000` | `100` | **Completely stable visual layout without shifts** |
| **Time to Interactive (TTI)** | `3.2 s` | `95` | Full input readiness on mobile hardware |

### Key Audit Highlights
- **Full Viewport Scalability**: Viewport uses `width=device-width, initial-scale=1.0, maximum-scale=5.0` without `user-scalable=no`, meeting WCAG accessibility standards.
- **Valid PWA Web App Manifest**: Manifest linked with `theme-color (#00e676)`, background color, standalone display mode, maskable and standard PNG icon sets.
- **Zero Render Jank**: Total Blocking Time of 0 ms ensures that all user taps and interactions respond immediately.

---

## 5. Step-by-Step Verification Checklist & Testing Guide

### Flow 1: PWA Installation Prompt
- [x] **Prerequisites**: Open Google Chrome or Chromium-based browser in a clean profile (or non-standalone window).
- [x] **Step 1**: Run `npm run build && npm run preview` and navigate to `http://localhost:4173/`.
- [x] **Step 2**: Observe the **Navbar**. The `<InstallPwaButton />` renders with a neon download icon and `"Install App"` label when the browser fires the `beforeinstallprompt` event.
- [x] **Step 3**: Click `"Install App"`. The native browser installation dialog opens with the app title (*HABIT//PULSE*), description, and the 512x512 icon.
- [x] **Step 4**: Confirm installation. The app launches in an isolated standalone PWA window without browser chrome.
- [x] **Step 5**: Observe that once installed (or running in standalone mode), the `"Install App"` button automatically disappears from the navigation bar.

### Flow 2: Offline App Shell Loading
- [x] **Step 1**: Start preview server and visit `http://localhost:4173/`.
- [x] **Step 2**: Open Chrome DevTools $\rightarrow$ **Application** tab $\rightarrow$ **Service Workers**. Confirm `sw.js` is installed, active, and controlling the page.
- [x] **Step 3**: Open Chrome DevTools $\rightarrow$ **Network** tab $\rightarrow$ Throttling dropdown $\rightarrow$ Select **Offline**.
- [x] **Step 4**: Perform a hard reload (`Cmd+Shift+R` on macOS, `Ctrl+F5` on Windows/Linux).
- [x] **Step 5**: **Expected Result**: The app shell, stylesheets, icons, fonts, and login/tracker layout render instantly with zero network errors. Cache Storage serves `index.html` and bundled assets via Workbox precache.

### Flow 3: Offline Habit Creation & Reconnect Synchronization
- [x] **Step 1**: In the active dashboard, set Network throttling to **Offline** in DevTools.
- [x] **Step 2**: An amber notification banner immediately slides in at the top of the tracker:
  `"Offline Mode — You are currently offline. Changes are saved locally and will sync when you reconnect."`
- [x] **Step 3**: Click `+ New Habit`, enter a title (e.g., `"Cold Plunge"`), choose frequency, and click `"Initialize Habit"`.
- [x] **Step 4**: **Optimistic UI Feedback**:
  - The habit card is instantly inserted at the top of the habit grid.
  - The card displays an amber badge: `"Queued Offline"`.
  - The offline banner counter updates to `"Offline Mode — 1 changes queued"`.
- [x] **Step 5**: **LocalStorage Inspection**:
  - DevTools $\rightarrow$ **Application** $\rightarrow$ **Local Storage** $\rightarrow$ `http://localhost:4173/`.
  - Key `habit_offline_queue_v1` contains an array with the newly queued habit object, temporary UUID (`offline_${crypto.randomUUID()}`), creation timestamp, and user ID.
- [x] **Step 6**: Toggle Network throttling back to **Online** (or "No throttling").
- [x] **Step 7**: **Automatic Sync Execution**:
  - The hook detects the `window.online` event.
  - Banner state changes to blue: `"Reconnected — Syncing 1 queued habit..."`.
  - The queued habit is submitted to Supabase via `POST /rest/v1/habits`.
  - Upon successful response, `habit_offline_queue_v1` is cleared.
  - Banner transitions to emerald green: `"Sync Complete — All habits synchronized with cloud!"` before auto-dismissing after 3 seconds.
  - The temporary habit in the UI is reconciled with the real database record, and the `"Queued Offline"` badge is removed.

### Flow 4: 320px Mobile Responsive Pass (Zero Horizontal Scroll)
- [x] **Step 1**: Open DevTools Device Mode (`Cmd+Shift+M`).
- [x] **Step 2**: Set screen dimensions to **320px width** (iPhone SE 1st gen / narrow mobile standard).
- [x] **Step 3**: Inspect the entire dashboard, navigation, habit cards, modal forms, and authentication screens.
- [x] **Step 4**: Verify in console that no horizontal scroll exists:
  ```javascript
  console.assert(document.documentElement.scrollWidth <= 320, 'Horizontal overflow detected!');
  ```
- [x] **Step 5**: **Key Responsive Behaviors**:
  - `.habits-grid` stacks into a single clean column (`grid-template-columns: 1fr`).
  - Text containers, frequency tags, and email user pills utilize `overflow: hidden`, `text-overflow: ellipsis`, and flex wrapping without clipping.
  - Touch targets maintain at least 44px minimum tap boundaries with accessible tap highlights.

### Flow 5: Prompt-Based Service Worker Update (`<UpdateToast />`)
- [x] **Step 1**: Verify `vite.config.ts` declares `registerType: 'prompt'`.
- [x] **Step 2**: When a new service worker script is detected on page revisit, Workbox moves it to the `waiting` state instead of forcing an immediate uncontrolled refresh.
- [x] **Step 3**: `useRegisterSW` triggers `needRefresh = true`.
- [x] **Step 4**: A sleek Cyber-Zen floating toast renders at the bottom-center of the viewport:
  `"New version available! Click refresh to load the latest cyber-zen features."`
- [x] **Step 5**: Clicking `"Refresh"` invokes `updateServiceWorker(true)`, which posts `{ type: 'SKIP_WAITING' }` to the waiting worker and refreshes the client window cleanly to activate the update.

---

## 6. Capstone File & Implementation Manifest

| Component / Artifact | File Path | Purpose & Responsibility |
| :--- | :--- | :--- |
| **Icon Generator** | [`scripts/generate-icons.js`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/scripts/generate-icons.js) | Generates 64x64, 192x192, 512x512, maskable 512x512, and 180x180 icons using Sharp |
| **PWA Manifest & Icons** | [`public/pwa-*.png`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/public), [`public/apple-touch-icon.png`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/public/apple-touch-icon.png) | High-resolution, maskable, and Apple touch icon suite |
| **PWA Vite Config** | [`vite.config.ts`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/vite.config.ts) | VitePWA configuration with `registerType: 'prompt'` and Workbox runtime caching |
| **Update Toast** | [`src/components/UpdateToast.tsx`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/UpdateToast.tsx) | Cyber-Zen prompt toast with `useRegisterSW` and `SKIP_WAITING` integration |
| **Network & Queue Hook** | [`src/hooks/useNetworkStatus.ts`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/hooks/useNetworkStatus.ts) | Online/offline tracking, `localStorage` FIFO queue (`habit_offline_queue_v1`), reconnect auto-sync |
| **Offline Banner** | [`src/components/OfflineBanner.tsx`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/OfflineBanner.tsx) | Real-time status banner (amber offline, blue syncing, green complete) |
| **Install PWA Button** | [`src/components/InstallPwaButton.tsx`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/InstallPwaButton.tsx) | Captures `beforeinstallprompt`, renders navbar install button, hides in standalone mode |
| **Web Share Button** | [`src/components/ShareButton.tsx`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/ShareButton.tsx) | Native Web Share API integration with clipboard copy fallback |
| **Mobile CSS Safeguards** | [`src/App.css`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/App.css) | 320px responsive grid, zero horizontal overflow safeguards, touch target sizing |
| **Caching Defense** | [`docs/CACHING_STRATEGY.md`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/docs/CACHING_STRATEGY.md) | In-depth Workbox caching architecture documentation and defenses |
| **Deliverables Report** | [`docs/PWA_CAPSTONE_DELIVERABLES.md`](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/docs/PWA_CAPSTONE_DELIVERABLES.md) | Comprehensive audit scores, caching defenses, and verification checklist |
