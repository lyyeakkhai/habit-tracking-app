# The Mission: Production Deployment, Performance Optimization & Expo Port — Design Document

**Date:** 2026-09-26  
**Status:** Approved  
**Author:** Pair Programming Co-pilot & Developer  

---

## 1. Executive Summary & Objectives

The goal of "The Mission" is to take the Cyber-Zen Habit Tracker to production grade across web and mobile:
1. **Web Performance Optimization:**
   - Implement `React.lazy` + `Suspense` on the heaviest route (`TrackerPage`).
   - Add explicit `width`, `height`, and `loading="lazy"` attributes on below-the-fold images / avatars.
   - Perform a dependency audit: replace `lucide-react` with a bespoke, zero-dependency SVG icon system, dropping `lucide-react` from `package.json`.
   - Measure and record before/after build chunk sizes.
2. **Production Deployment (Vercel):**
   - Deploy web app from GitHub to Vercel.
   - Configure real environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
   - Verify signed-in data persistence and habit state surviving a hard refresh.
3. **Expo Mobile App (`mobile/`):**
   - Scaffold a modern Expo app in the `mobile/` subdirectory using Expo Router and NativeWind.
   - Port the habit list using `FlatList`, displaying habit details, streak indicators, and completion toggles.
   - Implement a clean Add Habit screen with navigation between List and Add screens.
4. **Platform Branching (`Platform.select`):**
   - Implement a single platform-branch call site via `Platform.select` for sharing: web uses `navigator.share` (with clipboard fallback), while native uses `Share.share` from `react-native`.
   - Ensure zero web APIs leak unguarded into native execution paths.

---

## 2. Web Performance Optimization Pass

### 2.1 Route Code-Splitting Decision & Rationale

* **Target Route:** `TrackerPage` ([src/pages/TrackerPage.tsx](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/pages/TrackerPage.tsx))
* **Rationale:**
  - `TrackerPage` is by far the heaviest component in the application (~17KB source) and pulls in 7+ modals (`HabitModal`, `DeleteModal`, `AvatarUploadModal`, `InstallGuideModal`), PWA installation controllers, stats calculation routines, and complex offline queue sync hooks.
  - By splitting `TrackerPage` with `React.lazy` and wrapping routes with `<Suspense>`, unauthenticated visitors landing on `/login` or `/signup` do not download the habit tracking engine, modals, or offline queue handlers upfront.
  - Similarly, `LoginPage` and `SignupPage` will be lazy-loaded so authenticated users returning to the app don't download unneeded auth forms.
* **Loading State:**
  - A custom Cyber-Zen loading fallback with a pulsing neon spinner matching `#00e676` and `#00e5ff` aesthetics.

### 2.2 Image Loading Optimizations

* **Navbar Avatar:** In [src/components/Navbar.tsx](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/Navbar.tsx), add `loading="lazy"`, `width="36"`, `height="36"`, and `decoding="async"`.
* **Avatar Upload Preview:** In [src/components/AvatarUploadModal.tsx](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/AvatarUploadModal.tsx), add `loading="lazy"`, `width="160"`, `height="160"`, and `decoding="async"`.
* **CSS Prevention of Layout Shift (CLS):** Apply `aspect-ratio: 1 / 1` and explicit dimension containment.

### 2.3 Dependency Audit: Dropping `lucide-react`

* **Audit Target:** `lucide-react` (`^1.48.0`).
* **Motivation:**
  - Across the application, 15 components import individual icons from `lucide-react`.
  - Replacing `lucide-react` with a bespoke, zero-dependency SVG icon set ([src/components/icons/index.tsx](file:///Users/lyyeakkhai/workspace/dichi_js_course/habit/src/components/icons/index.tsx)) eliminates `lucide-react` from `node_modules` and drops an entire runtime dependency.
* **Icon Registry Implementation:**
  - Typed component API: `size`, `color`, `strokeWidth`, `className`, `style`.
  - Zero external package dependencies.
* **Verification & Metrics:**
  - Baseline chunk size: `dist/assets/index-CsY-57_K.js 547.76 kB │ gzip: 158.91 kB`
  - Record and document post-optimization build output table.

---

## 3. Platform Branching Strategy (`Platform.select`)

### 3.1 Single Call Site Architecture

* **Module:** `platformShare.ts`
* **Requirement:** Exactly one call site using `Platform.select`.
* **Guard Verification:**
  - **Native Branch (`default`):** Only calls `NativeShare.share` from `react-native`.
  - **Web Branch (`web`):** Uses `typeof navigator !== 'undefined'` and checks for `navigator.share` / `navigator.clipboard`.
  - **Zero Leakage:** No DOM or window object references exist in the native path.

```typescript
import { Platform, Share as NativeShare } from 'react-native'

export interface SharePayload {
  title: string
  text: string
  url?: string
}

export const shareHabit = async (payload: SharePayload): Promise<{ success: boolean; fallback?: boolean }> => {
  const handler = Platform.select({
    web: async () => {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            url: payload.url,
          })
          return { success: true }
        } catch (err: unknown) {
          if ((err as Error).name === 'AbortError') return { success: false }
        }
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const fullText = payload.url ? `${payload.text} ${payload.url}`.trim() : payload.text
        await navigator.clipboard.writeText(fullText)
        return { success: true, fallback: true }
      }
      return { success: false }
    },
    default: async () => {
      const message = payload.url ? `${payload.text}\n${payload.url}` : payload.text
      await NativeShare.share({
        title: payload.title,
        message,
        url: payload.url,
      })
      return { success: true }
    },
  })

  if (handler) {
    return await handler()
  }
  return { success: false }
}
```

---

## 4. Expo Mobile Application (`mobile/`)

### 4.1 Project Configuration & Scaffolding

* **Path:** `mobile/`
* **Framework:** Expo SDK 52+ with **Expo Router** and **NativeWind** (Tailwind CSS for React Native).
* **Dependencies:**
  - `expo`, `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-status-bar`
  - `nativewind`, `tailwindcss`
  - `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
* **Security & Environment:**
  - `.env` strictly listed in `mobile/.gitignore`.
  - Reads `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 4.2 Screens & Components ("Same React, New Primitives")

1. **Root Layout (`mobile/app/_layout.tsx`):**
   - Configures Cyber-Zen dark styling (`#0a0e14` background, `#00e676` tint).
   - Provides SafeAreaProvider and StatusBar.
2. **Habit List Screen (`mobile/app/index.tsx`):**
   - Employs React Native's `<FlatList>` for high-performance virtualization.
   - Each habit item displays:
     - Checkbox toggle button (`Pressable`) updating Supabase state.
     - Habit name, description, and frequency badge.
     - Current streak indicator with badge.
     - Native Share button invoking `shareHabit`.
   - Header with Add Habit button navigating to `/add`.
3. **Add Habit Screen (`mobile/app/add.tsx`):**
   - Modal/stack presentation with `TextInput` inputs for Habit Name and Description.
   - Frequency picker (Daily vs Weekly).
   - Streak goal input.
   - Submission button inserting to Supabase and calling `router.back()`.

---

## 5. Deployment & Audit Checklist

1. **Vercel Deployment:**
   - Code pushed to `main` branch on GitHub (`https://github.com/lyyeakkhai/habit-tracking-app.git`).
   - Project imported in Vercel with environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Live URL tested: sign in with test credentials, create habit, check habit, hard refresh to confirm persistence.
2. **Security Audit:**
   - Zero secrets or `.env` files tracked in Git.
3. **Expo Execution:**
   - App runs cleanly via `npx expo start` without bundler or type errors.
4. **Platform Branch Audit:**
   - Exactly one call site using `Platform.select`.
   - Zero web APIs unguarded in the native execution path.

---

## 6. Deliverables Specification

1. **Links:**
   - Live Vercel URL
   - GitHub Repository link (tracking both Web and Expo Mobile)
2. **Artifacts & Reports:**
   - Build output chunk table (Before vs. After optimization)
   - Dependency audit report (lucide-react removal impact)
   - Platform branch audit report
3. **Final Reflection:**
   - One sentence identifying what would be ported next, and which half (logic or rendering) moves for free.
