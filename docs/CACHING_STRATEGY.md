# Workbox Runtime Caching Strategy & Defense

## Executive Overview

**HABIT//PULSE** is engineered as an offline-first Cyber-Zen habit tracking progressive web application. A core architectural principle is that network failure or degraded cellular connectivity ("Lie-Fi") must never prevent a user from opening the application, inspecting habits, or logging progress.

To balance data freshness against instant loading and offline availability, the application employs a hybrid caching model combining **Compile-Time Precache** and four targeted **Workbox Runtime Caching Strategies**.

---

## Caching Strategy Matrix

| Category | Cache Name | Pattern | Strategy | Expiration / Limits | Status Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **App Shell** | *Workbox Precache* | `**/*.{js,css,html,svg,png,ico,woff,woff2}` | **Precache & Route** | Tied to build revision | 200 |
| **Font Stylesheets** | `google-fonts-stylesheets` | `^https://fonts.googleapis.com/.*` | **StaleWhileRevalidate** | 10 entries / 365 days | 0, 200 |
| **Webfonts Binaries** | `google-fonts-webfonts` | `^https://fonts.gstatic.com/.*` | **CacheFirst** | 30 entries / 365 days | 0, 200 |
| **Images & Avatars** | `images-cache` | `\.(?:png\|jpg\|jpeg\|svg\|gif\|webp\|avif)$` | **CacheFirst** | 60 entries / 30 days | 0, 200 |
| **Supabase PostgREST API** | `supabase-api-cache` | `^https://.*\.supabase\.co/rest/v1/.*` | **NetworkFirst** | 100 entries / 24 hrs (`networkTimeoutSeconds: 3`) | 0, 200 |

---

## Detailed Rules & Architectural Defenses

### 1. App Shell Assets (Compile-Time Precache)
* **Target**: `index.html`, hashed JavaScript bundles, CSS stylesheets, and core PWA manifest icons.
* **Strategy**: `precacheAndRoute`
* **One-Sentence Defense**:
  > *The HTML shell and hashed build bundles are fixed at compile time and essential for booting the app, so precaching them on install guarantees instant offline startup and zero-latency repeat visits.*
* **Rationale**:
  Precached assets are versioned with cryptographic content hashes generated during `vite build`. Workbox automatically invalidates and removes old revisions upon service worker activation (`cleanupOutdatedCaches`), ensuring zero risk of stale code while guaranteeing offline bootability.

---

### 2. Google Fonts Stylesheets (`fonts.googleapis.com`)
* **Target**: CSS stylesheets returned by Google Fonts API.
* **Strategy**: `StaleWhileRevalidate`
* **Cache Name**: `google-fonts-stylesheets`
* **Max Entries**: 10 | **Max Age**: 1 year (31,536,000s)
* **One-Sentence Defense**:
  > *The font stylesheet renders immediately from cache for optimal paint performance, while simultaneously querying Google's CDN in the background to seamlessly pick up any font definition updates.*
* **Rationale**:
  Font stylesheets link font declarations with actual woff2 binary URLs. Because these stylesheets rarely change between minor releases but may periodically be updated by Google's CDN, serving the cached version eliminates render-blocking network roundtrips while ensuring future visits receive the latest declarations.

---

### 3. Google Fonts Webfonts (`fonts.gstatic.com`)
* **Target**: Static WOFF2 font binary files hosted on `fonts.gstatic.com`.
* **Strategy**: `CacheFirst`
* **Cache Name**: `google-fonts-webfonts`
* **Max Entries**: 30 | **Max Age**: 1 year (31,536,000s)
* **One-Sentence Defense**:
  > *Font binaries are content-hashed and immutable, making it safe to serve them directly from local cache for up to a year without incurring redundant network latency.*
* **Rationale**:
  Each font file URL delivered by Google Fonts contains a unique hash. If the font file does not change, re-fetching it wastes mobile bandwidth and delays text rendering. Once fetched, the binary can be cached indefinitely (up to 1 year).

---

### 4. Images, Static Graphics & User Avatars
* **Target**: Static and dynamic image formats (`.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`, `.avif`).
* **Strategy**: `CacheFirst`
* **Cache Name**: `images-cache`
* **Max Entries**: 60 | **Max Age**: 30 days (2,592,000s)
* **One-Sentence Defense**:
  > *Static graphic assets rarely change and consume significant mobile bandwidth, so serving them directly from cache ensures snappy rendering and minimizes cellular data usage on mobile devices.*
* **Rationale**:
  Graphics and avatars are non-critical decorative or identity assets. Serving them from cache preserves battery and mobile bandwidth. An LRU limit of 60 entries and a 30-day TTL prevents unbounded storage growth on client devices.

---

### 5. Supabase PostgREST API (`/rest/v1/*`)
* **Target**: Database read endpoints from Supabase (`https://<project>.supabase.co/rest/v1/*`).
* **Strategy**: `NetworkFirst` with `networkTimeoutSeconds: 3`
* **Cache Name**: `supabase-api-cache`
* **Max Entries**: 100 | **Max Age**: 24 hours (86,400s)
* **One-Sentence Defense**:
  > *Habit and streak states must always be as fresh as possible, but if the device is on a train with no signal or experiencing high packet loss, falling back to the cached response after a 3-second timeout ensures the dashboard still opens and displays recent habits.*
* **Rationale**:
  * **Freshness Priority**: Active habit tracking demands real-time streak calculations and completion state. NetworkFirst ensures that whenever a reliable connection exists, data is pulled live from the database.
  * **Lie-Fi Protection (3-Second Timeout)**: When an HTTP request hangs on a degraded cellular connection (Lie-Fi), standard browser timeouts can leave the user staring at a spinner for 30–60 seconds. Workbox aborts the network wait after 3 seconds and serves the last known good cached response, unlocking instant usability.
  * **Offline Fallback**: When completely disconnected, the cached JSON response is returned immediately, allowing the UI to hydrate recent habits seamlessly.

---

## Lifecycle, Invalidation & Edge Case Handling

1. **Prompt-Based Registration (`registerType: 'prompt'`)**:
   Service worker updates download in the background but do not immediately usurp active tabs. An `<UpdateToast />` notifies the user that a new version is available.
2. **Atomic Upgrades (`SKIP_WAITING`)**:
   When the user clicks "Update" in `<UpdateToast />`, the new service worker sends `{ type: 'SKIP_WAITING' }`, takes control, and refreshes the window to mount the updated assets.
3. **Outdated Cache Pruning (`cleanupOutdatedCaches()`)**:
   Any cache created by previous service worker versions that no longer matches current precache manifests is purged automatically on activation.
4. **Opaque Responses (`statuses: [0, 200]`)**:
   External CDNs (Google Fonts, Google Static) return opaque responses (`status: 0`) when requested without CORS headers. Including `0` in `cacheableResponse.statuses` ensures Workbox properly stores these cross-origin resources.

---

## Verification & Testing Guide

> [!WARNING]
> Never test service worker behavior using `npm run dev`. Development mode uses Vite's hot-module-replacement server where service worker interception is disabled to avoid caching active development edits.

Always verify service worker registration and caching strategies against a production build:

```bash
# 1. Build the production bundle
npm run build

# 2. Inspect generated service worker
cat dist/sw.js | grep -E "(StaleWhileRevalidate|CacheFirst|NetworkFirst)"

# 3. Serve via preview
npm run preview
```

### In-Browser DevTools Verification
1. Open Chrome DevTools $\rightarrow$ **Application** tab.
2. **Service Workers**: Verify `dist/sw.js` is active and running.
3. **Cache Storage**:
   * Inspect `workbox-precache-v2-...` for app shell assets.
   * Inspect `google-fonts-stylesheets` and `google-fonts-webfonts` after font loads.
   * Inspect `images-cache` after loading SVG/PNG icons.
   * Inspect `supabase-api-cache` after querying habits.
4. **Network Throttling**:
   * Set Network throttling to **Offline** or **Slow 3G**.
   * Refresh page: Confirm app shell boots instantly and cached habit list renders within 3 seconds.
