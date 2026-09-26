# The Mission: Production Deployment, Performance Optimization & Expo Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-grade habit tracker by optimizing web performance (React.lazy, image lazy loading, dropping `lucide-react`), deploying to Vercel with real env vars, building a platform share branch with zero web API leakage, and porting the habit list to an Expo mobile app using FlatList and NativeWind.

**Architecture:** Route-level code-splitting separates heavy tracker routines from entry auth pages; a zero-dependency SVG icon set completely removes external icon libraries. A platform-guarded sharing module abstracts `navigator.share` (web) and `Share.share` (native). The Expo app in `mobile/` mirrors the Supabase habit schema and utilizes `FlatList` with Expo Router for rapid, fluid navigation.

**Tech Stack:** React 19, Vite, TypeScript, Supabase JS client, Expo SDK 52, Expo Router, NativeWind (Tailwind CSS for React Native), React Native (`Share`, `FlatList`, `Pressable`, `TextInput`).

## Global Constraints

- No secrets or `.env` files tracked in Git.
- Web chunk size reduction measured before and after `npm run build`.
- Exactly one call site for the platform branch using `Platform.select`.
- Zero web APIs unguarded in the native execution path.
- Keep implementations direct and practical; avoid unnecessary abstractions.

---

### Task 1: Web Performance Pass — Route Lazy-Loading with React.lazy & Suspense

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `React.lazy`, `React.Suspense` from React
- Produces: Dynamic chunks for `TrackerPage`, `LoginPage`, and `SignupPage` with a Cyber-Zen loading fallback

- [ ] **Step 1: Inspect and verify baseline build**
Run: `npm run build`
Verify initial single bundle output (`dist/assets/index-*.js`).

- [ ] **Step 2: Add Cyber-Zen loading spinner style to `src/App.css`**
Add styles for `.route-loading-fallback` with pulsing neon spinner centered in viewport.

- [ ] **Step 3: Update `src/App.tsx` to lazy load routes with Suspense**
Replace static page imports with `React.lazy(() => import('./pages/...'))` and wrap `<Routes>` in `<Suspense fallback={<LoadingFallback />}>`.

- [ ] **Step 4: Verify build generates separate route chunks**
Run: `npm run build`
Expected: Distinct chunks generated for `TrackerPage`, `LoginPage`, and `SignupPage`.

- [ ] **Step 5: Commit changes**
```bash
git add src/App.tsx src/App.css
git commit -m "perf(web): code-split routes using React.lazy and Suspense"
```

---

### Task 2: Web Image Optimizations & Layout Shift (CLS) Prevention

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/AvatarUploadModal.tsx`

**Interfaces:**
- Consumes: Standard HTML `<img>` attributes (`loading="lazy"`, `width`, `height`, `decoding="async"`)
- Produces: Optimized image elements with reserved layout dimensions

- [ ] **Step 1: Update avatar in `src/components/Navbar.tsx`**
Add `loading="lazy"`, `decoding="async"`, `width="36"`, and `height="36"` to the avatar `<img>` tag with inline style `aspectRatio: '1 / 1'`.

- [ ] **Step 2: Update preview image in `src/components/AvatarUploadModal.tsx`**
Add `loading="lazy"`, `decoding="async"`, `width="160"`, and `height="160"` to the avatar preview `<img>` tag with `aspectRatio: '1 / 1'`.

- [ ] **Step 3: Verify build passes without type or lint errors**
Run: `npm run build`
Expected: Build succeeds cleanly.

- [ ] **Step 4: Commit changes**
```bash
git add src/components/Navbar.tsx src/components/AvatarUploadModal.tsx
git commit -m "perf(web): add loading=lazy and explicit dimensions to avatar images"
```

---

### Task 3: Dependency Audit — Replace and Drop `lucide-react`

**Files:**
- Create: `src/components/icons/index.tsx`
- Modify: All components currently importing from `lucide-react`:
  - `src/components/Navbar.tsx`
  - `src/components/InstallPwaButton.tsx`
  - `src/components/OfflineBanner.tsx`
  - `src/components/InstallGuideModal.tsx`
  - `src/components/UpdateToast.tsx`
  - `src/components/ShareButton.tsx`
  - `src/components/DeleteModal.tsx`
  - `src/components/AvatarUploadModal.tsx`
  - `src/components/EmptyState.tsx`
  - `src/components/HabitCard.tsx`
  - `src/components/ErrorBoundary.tsx`
  - `src/components/HabitModal.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/pages/SignupPage.tsx`
  - `src/pages/TrackerPage.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: Pure SVG icons with props interface: `{ size?: number; color?: string; strokeWidth?: number; className?: string; style?: React.CSSProperties; fill?: string }`
- Produces: Zero-dependency icon replacement dropping `lucide-react` entirely

- [ ] **Step 1: Create `src/components/icons/index.tsx`**
Implement lightweight typed SVG icons matching all required icon names (`Zap`, `LogOut`, `Camera`, `Download`, `WifiOff`, `RefreshCw`, `CheckCircle`, `CheckCircle2`, `X`, `Laptop`, `Smartphone`, `Compass`, `Sparkles`, `Share2`, `Check`, `AlertTriangle`, `Upload`, `AlertCircle`, `ImageIcon`, `Plus`, `Flame`, `Edit3`, `Trash2`, `Calendar`, `ListFilter`, `ShieldAlert`, `ArrowRight`, `Lock`, `Mail`).

- [ ] **Step 2: Update all import statements from `'lucide-react'` to `'./icons'` / `'../components/icons'`**
Replace all `from 'lucide-react'` statements across the 15 files with imports from the new icons module.

- [ ] **Step 3: Uninstall `lucide-react` package**
Run: `npm uninstall lucide-react`
Verify `package.json` no longer contains `lucide-react`.

- [ ] **Step 4: Run build and record chunk size comparison table**
Run: `npm run build`
Record before/after chunk sizes and gzip metrics.

- [ ] **Step 5: Commit changes**
```bash
git add src/components/icons/index.tsx src/components/ src/pages/ package.json package-lock.json
git commit -m "perf(deps): drop lucide-react in favor of zero-dependency SVG icon set"
```

---

### Task 4: Platform Branching — Single Call Site Sharing Module

**Files:**
- Create: `src/lib/platformShare.ts`
- Modify: `src/components/ShareButton.tsx`

**Interfaces:**
- Consumes: `{ title: string; text: string; url?: string }`
- Produces: `shareHabit(payload)` function using `Platform.select` (with web `navigator.share` / clipboard and native `Share.share`), touching exactly one call site with zero unguarded web APIs

- [ ] **Step 1: Create `src/lib/platformShare.ts`**
Implement the unified share interface utilizing `Platform.select({ web: ..., default: ... })` with full environment guards (`typeof navigator !== 'undefined'`) and native fallback.

- [ ] **Step 2: Refactor `src/components/ShareButton.tsx` to consume `shareHabit`**
Replace custom inline `navigator.share` / clipboard logic in `ShareButton` with a direct call to `shareHabit`.

- [ ] **Step 3: Run build to verify type safety and bundle cleanliness**
Run: `npm run build`
Expected: Build passes with zero errors.

- [ ] **Step 4: Commit changes**
```bash
git add src/lib/platformShare.ts src/components/ShareButton.tsx
git commit -m "feat(share): introduce platform-guarded share module with single call site"
```

---

### Task 5: Expo Mobile App Setup (`mobile/`)

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/metro.config.js`
- Create: `mobile/tailwind.config.js`
- Create: `mobile/global.css`
- Create: `mobile/.gitignore`
- Create: `mobile/lib/supabase.ts`
- Create: `mobile/lib/platformShare.ts`
- Create: `mobile/types/habit.ts`

**Interfaces:**
- Consumes: Expo SDK 52, Expo Router, NativeWind, Supabase JS client
- Produces: Configured mobile workspace connecting to the habit tracker database

- [ ] **Step 1: Initialize `mobile/` directory and configure `package.json`**
Set up dependencies: `expo`, `expo-router`, `react-native`, `react-native-safe-area-context`, `react-native-screens`, `expo-status-bar`, `nativewind`, `tailwindcss`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`.

- [ ] **Step 2: Configure Babel, Metro, Tailwind, and App configs**
Configure `tailwind.config.js`, `babel.config.js`, `metro.config.js`, and `app.json` for Expo Router and NativeWind.

- [ ] **Step 3: Ensure `mobile/.gitignore` excludes `.env` and build artifacts**
Add `.env`, `.expo`, `node_modules/` to `mobile/.gitignore`.

- [ ] **Step 4: Create Supabase client and shared types in `mobile/`**
Implement `mobile/lib/supabase.ts` and `mobile/types/habit.ts` mirroring the web data models.

- [ ] **Step 5: Implement `mobile/lib/platformShare.ts`**
Implement native `shareHabit` invoking `Share.share` from `react-native`.

- [ ] **Step 6: Commit mobile app initialization**
```bash
git add mobile/
git commit -m "chore(mobile): scaffold expo mobile application with nativewind and supabase"
```

---

### Task 6: Port Habit List & Add Habit Screens to Expo

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/app/add.tsx`

**Interfaces:**
- Consumes: `FlatList`, `Pressable`, `TextInput`, `View`, `Text` from `react-native`, Expo Router hooks (`useRouter`, `Stack`)
- Produces: High-performance native habit list and creation screens styled with Cyber-Zen theme

- [ ] **Step 1: Create Root Layout `mobile/app/_layout.tsx`**
Define Stack navigator with dark Cyber-Zen theme header (`#0a0e14` background, `#00e676` accents).

- [ ] **Step 2: Implement Habit List Screen in `mobile/app/index.tsx`**
Build the screen with:
- React Native `<FlatList>` rendering habit items.
- Item card with check-off toggle (`Pressable`), streak count, frequency badge, and native share button.
- Header button navigating to `/add`.
- Pull-to-refresh or refresh control.

- [ ] **Step 3: Implement Add Habit Screen in `mobile/app/add.tsx`**
Build the screen with:
- Input for habit name and description.
- Frequency selector (Daily / Weekly).
- Target streak input.
- Save button creating the habit in Supabase and calling `router.back()`.

- [ ] **Step 4: Commit mobile screens**
```bash
git add mobile/app/
git commit -m "feat(mobile): port habit list with FlatList and add habit screen"
```

---

### Task 7: Verification, Production Deployment & Deliverables Report

**Files:**
- Create: `docs/THE_MISSION_DELIVERABLES.md`

**Interfaces:**
- Consumes: Vercel deployment link, build metrics, audit checklist
- Produces: Comprehensive submission documentation with chunk size tables, live URLs, and transfer reflection

- [ ] **Step 1: Run comprehensive web verification**
Execute `npm run build` and `npm run lint`. Verify zero errors and capture final chunk sizes.

- [ ] **Step 2: Push changes to GitHub repository**
Push branch to `origin main` to trigger or prepare Vercel deployment.

- [ ] **Step 3: Document Vercel deployment procedure and environment variable configuration**
Detail instructions for setting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard and testing sign-in persistence.

- [ ] **Step 4: Generate `docs/THE_MISSION_DELIVERABLES.md`**
Assemble:
- Before/After build chunk size comparison table.
- Dependency audit summary (dropping `lucide-react`).
- Platform branch audit summary (call site isolation & guard check).
- Expo execution commands and instructions.
- One-sentence reflection on what to port next and which half moves for free.

- [ ] **Step 5: Final commit and push**
```bash
git add docs/THE_MISSION_DELIVERABLES.md
git commit -m "docs: finalize The Mission deliverables, chunk metrics, and audit report"
git push origin main
```
