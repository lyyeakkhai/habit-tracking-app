# Supabase Backend & Neon Green Habit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade habit tracking web application with Supabase authentication, PostgreSQL database with Row Level Security (RLS) and cascading deletes, guarded routes, full CRUD UI, and a Cyber-Zen neon green aesthetic.

**Architecture:** A React 19 + TypeScript + Vite frontend powered by an `AuthContext` managing Supabase sessions, `react-router-dom` with a `ProtectedRoute` redirecting unauthenticated users to `/login`, and a `useHabits` hook providing CRUD operations scoped to `user.id`. The PostgreSQL database enforces multi-tenant privacy via hand-written RLS policies (`auth.uid() = user_id`) and cascading foreign keys.

**Tech Stack:** React 19, TypeScript, Vite, `@supabase/supabase-js`, `react-router-dom`, `lucide-react`, Vanilla CSS (Design Tokens & Glassmorphism).

## Global Constraints
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must only reside in `.env`, which must remain strictly gitignored.
- Create `src/lib/supabase.js` and provide typed `src/lib/supabase.ts`.
- Every database query must target `.eq("user_id", user.id)` and `.eq("id", id)`.
- Hand-write RLS policies on `habits` and `daily_logs` for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Foreign key from `daily_logs.habit_id` to `habits.id` must specify `ON DELETE CASCADE`.
- The Tracker page must be guarded behind `ProtectedRoute` redirecting to `/login`.
- A second test account must see an empty list without errors or data leak from the first account.
- Hard refresh on any route must preserve active session and data without redirect loops.
- Deliver the attacker threat statement answering what an attacker could do if RLS were disabled.

---

### Task 1: Package Dependencies & Supabase Client Setup

**Files:**
- Modify: `habit/package.json`
- Create: `habit/src/lib/supabase.js`
- Create: `habit/src/lib/supabase.ts`
- Test: `habit/src/lib/supabase.test.ts` (or node verification script)

**Interfaces:**
- Produces: `supabase` client instance from `@supabase/supabase-js` exported from `src/lib/supabase.js` and `src/lib/supabase.ts`.

- [ ] **Step 1: Install `@supabase/supabase-js`, `react-router-dom`, and `lucide-react`**

Run: `npm install @supabase/supabase-js react-router-dom lucide-react`
Verify dependencies are added to `package.json`.

- [ ] **Step 2: Create `src/lib/supabase.js`**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
```

- [ ] **Step 3: Create typed `src/lib/supabase.ts`**

```typescript
import { supabase } from './supabase.js'
export { supabase }
export default supabase
```

- [ ] **Step 4: Verify client instantiation and environment variables without errors**

Run a quick build check: `npx tsc --noEmit`
Verify: zero TypeScript errors on Supabase client setup.

- [ ] **Step 5: Commit changes**

```bash
git add package.json package-lock.json src/lib/supabase.js src/lib/supabase.ts
git commit -m "feat: install supabase and react router, initialize supabase client"
```

---

### Task 2: Database Schema, Cascading Foreign Keys, & RLS Migration

**Files:**
- Create: `habit/supabase/migrations/20260926_habits_and_daily_logs.sql`
- Create: `habit/supabase/seed.sql`

**Interfaces:**
- Produces: Fully executable SQL migration script for Supabase SQL Editor creating `habits` and `daily_logs` with `ON DELETE CASCADE` and RLS policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

- [ ] **Step 1: Create SQL migration file `supabase/migrations/20260926_habits_and_daily_logs.sql`**

Write table schemas with `ON DELETE CASCADE`, indexes, and RLS policies matching `auth.uid() = user_id`.

- [ ] **Step 2: Create `supabase/seed.sql` with sample seed data and clear instructions**

Provide seed templates and instructions for testing in the Supabase Dashboard.

- [ ] **Step 3: Commit SQL migration and seed artifacts**

```bash
git add supabase/
git commit -m "feat: add PostgreSQL schema, cascading foreign keys, and RLS policies"
```

---

### Task 3: Auth Layer & Protected Route

**Files:**
- Create: `habit/src/context/AuthContext.tsx`
- Create: `habit/src/components/ProtectedRoute.tsx`

**Interfaces:**
- Produces: `useAuth()` hook returning `{ user, session, loading, signIn, signUp, signOut }` and `ProtectedRoute` component.

- [ ] **Step 1: Implement `src/context/AuthContext.tsx`**

Implement `AuthContext` with `supabase.auth.getSession()` on initial mount and `supabase.auth.onAuthStateChange` listener to manage active session. Include `signIn`, `signUp`, and `signOut` helper functions.

- [ ] **Step 2: Implement `src/components/ProtectedRoute.tsx`**

Implement component that checks `loading`. If loading, renders a neon shimmer spinner; if `!user`, redirects via `<Navigate to="/login" replace />`; otherwise renders `children`.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit auth layer**

```bash
git add src/context/AuthContext.tsx src/components/ProtectedRoute.tsx
git commit -m "feat: implement AuthContext with onAuthStateChange and ProtectedRoute"
```

---

### Task 4: Cyber-Zen Neon Green Design System Foundations

**Files:**
- Modify: `habit/index.html` (Google Fonts: Outfit, Inter, JetBrains Mono)
- Modify: `habit/src/index.css` (tokens, animations, utilities, glassmorphism)
- Modify: `habit/src/App.css` (app layout and container styles)

**Interfaces:**
- Produces: Global CSS variables (`--bg-primary`, `--accent-neon`, `--glow-neon`, `--glass-surface`, etc.) and classes (`.btn-neon`, `.card-glass`, `.neon-glow`, `.badge-streak`).

- [ ] **Step 1: Update `index.html` with Google Fonts and meta tags**

Add Google Fonts: `Outfit:wght@400;600;700`, `Inter:wght@400;500;600`, and `JetBrains Mono:wght@500;700`.

- [ ] **Step 2: Update `src/index.css` with the complete Neon Green Cyber-Zen design system**

Implement tokens, typography, glassmorphism, responsive utilities, neon buttons, input styling, and animations.

- [ ] **Step 3: Update `src/App.css` for application layouts and responsive grid**

- [ ] **Step 4: Verify CSS syntax and dev server build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit design system**

```bash
git add index.html src/index.css src/App.css
git commit -m "style: implement cyber-zen neon green design system and typography"
```

---

### Task 5: Authentication Pages (`/login` & `/signup`)

**Files:**
- Create: `habit/src/pages/LoginPage.tsx`
- Create: `habit/src/pages/SignupPage.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/context/AuthContext.tsx`.
- Produces: Polished, responsive login and signup views with error feedback and neon aesthetics.

- [ ] **Step 1: Implement `src/pages/LoginPage.tsx`**

Email and password form, loading state, error alert banners, and direct link to `/signup`.

- [ ] **Step 2: Implement `src/pages/SignupPage.tsx`**

Email, password, password confirmation, validation, error alert banners, and direct link to `/login`.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit auth pages**

```bash
git add src/pages/LoginPage.tsx src/pages/SignupPage.tsx
git commit -m "feat: create neon-themed login and signup pages"
```

---

### Task 6: Habit Data Layer & CRUD Hook (`useHabits`)

**Files:**
- Create: `habit/src/types/habit.ts`
- Create: `habit/src/hooks/useHabits.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts` and `user` from `useAuth()`.
- Produces: `useHabits()` hook with `{ habits, todayLogs, loading, error, addHabit, updateHabit, deleteHabit, toggleDailyLog, refreshHabits }`.

- [ ] **Step 1: Define TypeScript models in `src/types/habit.ts`**

Define `Habit`, `DailyLog`, and `HabitWithStatus` interfaces.

- [ ] **Step 2: Implement `src/hooks/useHabits.ts`**

Implement:
- `fetchHabits`: query `habits` with `.eq('user_id', user.id)` and `daily_logs` for today.
- `addHabit`: insert into `habits` with `{ ...data, user_id: user.id }`.
- `updateHabit`: update `habits` with `.eq('id', id).eq('user_id', user.id)`.
- `deleteHabit`: delete from `habits` with `.eq('id', id).eq('user_id', user.id)`.
- `toggleDailyLog`: insert/delete in `daily_logs` for today, triggering instant optimistic UI update.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit habit hook**

```bash
git add src/types/habit.ts src/hooks/useHabits.ts
git commit -m "feat: implement useHabits hook with scoped CRUD and optimistic toggles"
```

---

### Task 7: UI Components (Navbar, Cards, Modals, Empty State)

**Files:**
- Create: `habit/src/components/Navbar.tsx`
- Create: `habit/src/components/HabitCard.tsx`
- Create: `habit/src/components/HabitModal.tsx`
- Create: `habit/src/components/DeleteModal.tsx`
- Create: `habit/src/components/EmptyState.tsx`

**Interfaces:**
- Produces: Modular UI components styling habit cards, creation/edit modals, cascade-delete warning modals, and empty state cards.

- [ ] **Step 1: Implement `src/components/Navbar.tsx`**

Header bar with logo `⚡ HABIT//PULSE`, user email pill, daily completion counter, and Sign Out button.

- [ ] **Step 2: Implement `src/components/HabitCard.tsx`**

Neon completion ring toggle, streak counter badge, frequency indicator, and edit/delete trigger buttons.

- [ ] **Step 3: Implement `src/components/HabitModal.tsx`**

Add/Edit modal with name, description, frequency (daily/weekly), and target streak fields.

- [ ] **Step 4: Implement `src/components/DeleteModal.tsx`**

Confirmation modal highlighting that deleting a habit cascades to delete all linked logs.

- [ ] **Step 5: Implement `src/components/EmptyState.tsx`**

Welcoming neon dashed card for empty habit list with "+ Create Your First Habit" button.

- [ ] **Step 6: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit UI components**

```bash
git add src/components/
git commit -m "feat: build modular habit UI components with neon aesthetic"
```

---

### Task 8: Dashboard Assembly & Router Integration

**Files:**
- Create: `habit/src/pages/TrackerPage.tsx`
- Modify: `habit/src/App.tsx`
- Modify: `habit/src/main.tsx`

**Interfaces:**
- Integrates all components into routes `/`, `/login`, `/signup`.

- [ ] **Step 1: Implement `src/pages/TrackerPage.tsx`**

Integrate `Navbar`, `useHabits`, `HabitCard`, `HabitModal`, `DeleteModal`, `EmptyState`, and filter pills.

- [ ] **Step 2: Update `src/App.tsx` with React Router routes and ProtectedRoute**

Setup `<Routes>`:
- `/login` -> `<LoginPage />`
- `/signup` -> `<SignupPage />`
- `/` -> `<ProtectedRoute><TrackerPage /></ProtectedRoute>`
- `*` -> `<Navigate to="/" replace />`

- [ ] **Step 3: Wrap `src/main.tsx` with `<BrowserRouter>` and `<AuthProvider>`**

- [ ] **Step 4: Verify production build**

Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit dashboard and routing**

```bash
git add src/pages/TrackerPage.tsx src/App.tsx src/main.tsx
git commit -m "feat: assemble habit tracker dashboard with routing and protected views"
```

---

### Task 9: Verification, Security Audit & Deliverables

**Files:**
- Create: `habit/docs/AUDIT_AND_DELIVERABLES.md`

**Interfaces:**
- Produces: Audit checklist verification, documentation for running locally, screenshots guidance, and attacker threat statement.

- [ ] **Step 1: Verify `git status` shows no `.env`**

Run: `git status`
Verify: `.env` is absent.

- [ ] **Step 2: Launch local dev server and test in browser**

Run: `npm run dev`
Verify live page loading, responsiveness, and console cleanly without errors.

- [ ] **Step 3: Create `docs/AUDIT_AND_DELIVERABLES.md`**

Document:
- GitHub repo link
- How to run locally (`npm install`, `npm run dev`)
- SQL Editor setup instructions
- Attacker threat statement:
  *"If RLS were disabled once the app is deployed, an attacker could use the public anonymous API key exposed in the browser bundle to directly query, read, overwrite, or delete every user's private habits and daily logs via the Supabase PostgREST API without needing any account credentials."*
- Audit checklist verification results

- [ ] **Step 4: Commit and push feature branch**

```bash
git add docs/AUDIT_AND_DELIVERABLES.md
git commit -m "docs: add audit checklist, deliverables, and security threat statement"
git push origin feature/supabase-backend-neon-green
```
