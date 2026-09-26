# Design Specification: Supabase Backend & Neon Green Habit Tracker

**Date**: 2026-09-26  
**Status**: Approved / Ready for Implementation Plan  
**Branch**: `feature/supabase-backend-neon-green`  
**GitHub Repository**: [habit-tracking-app](https://github.com/lyyeakkhai/habit-tracking-app.git)

---

## 1. Executive Summary & Goals

This project provides a secure, production-grade backend for the Habit Tracker web application using Supabase (Auth, PostgreSQL, Row Level Security) and React 19.
Key requirements:
1. **Multi-Tenant Privacy**: Strangers cannot view or manipulate each other's habits or logs.
2. **Cascading Integrity**: Deleting a habit automatically purges all related `daily_logs` (`ON DELETE CASCADE`).
3. **Session Persistence**: Refreshing the browser preserves the active session without flickering or loss of data.
4. **Guarded Navigation**: Protected routes redirect unauthenticated users to `/login`.
5. **Full CRUD**: Create, Read, Update/Toggle, and Delete operations with loading states and error handling.
6. **Neon Green Cyber-Zen Aesthetic**: Premium obsidian dark palette with electric neon green accents, glowing interactive elements, and glassmorphism.

---

## 2. Database Schema & RLS Security

### 2.1 Table Definitions (`schema.sql`)

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_streak INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Daily Logs Table with Foreign Key ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(habit_id, log_date)
);

-- Index for high performance queries
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_habit_id ON public.daily_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date);
```

### 2.2 Row Level Security (RLS) Policies

Both tables have RLS explicitly enabled. Every query is evaluated at the database level against `auth.uid() = user_id`.

```sql
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Users can view own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- Daily Logs Policies
CREATE POLICY "Users can view own daily logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);
```

### 2.3 Seed Data (for SQL Editor)
Seed script creates sample habits and daily logs linked to the current testing user ID.

---

## 3. Frontend Architecture

### 3.1 Technology Stack
- **Framework**: React 19 + TypeScript + Vite
- **Routing**: `react-router-dom`
- **SDK**: `@supabase/supabase-js`
- **Styling**: Vanilla CSS Design Tokens (Dark Obsidian Canvas + Electric Neon Green)

### 3.2 File & Directory Structure
```
habit/
├── .env                  # Gitignored: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .env.example          # Public template
├── .gitignore            # Ignores .env and .env.*
├── supabase/
│   └── migrations/
│       └── 001_create_habits_and_logs.sql # Complete SQL for Supabase editor
├── src/
│   ├── lib/
│   │   ├── supabase.js   # Supabase client instantiation
│   │   └── supabase.ts   # Re-export / TypeScript typed client
│   ├── context/
│   │   └── AuthContext.tsx # Session tracking, login, signup, logout
│   ├── hooks/
│   │   └── useHabits.ts   # CRUD operations, state, loading, error handlers
│   ├── components/
│   │   ├── ProtectedRoute.tsx # Guards tracker, redirects to /login
│   │   ├── Navbar.tsx         # User info, progress, sign out
│   │   ├── HabitCard.tsx      # Habit card with neon completion toggle, streak, edit/delete
│   │   ├── HabitModal.tsx     # Add / Edit habit modal form
│   │   ├── DeleteModal.tsx    # Confirm deletion with cascade explanation
│   │   └── EmptyState.tsx     # Clean empty state for new accounts
│   ├── pages/
│   │   ├── LoginPage.tsx      # Sign in form
│   │   ├── SignupPage.tsx     # Sign up form
│   │   └── TrackerPage.tsx    # Main habit dashboard
│   ├── index.css              # Cyber-Zen design tokens, neon glows, reset
│   ├── App.css                # Layout & animations
│   ├── App.tsx                # Routes config
│   └── main.tsx               # Entry point with BrowserRouter & AuthProvider
```

---

## 4. UI Design System (Neon Green Cyber-Zen)

- **Colors**:
  - Background Canvas: `#080b0e`
  - Glass Card: `rgba(16, 24, 20, 0.75)` with `backdrop-filter: blur(16px)`
  - Border Accent: `rgba(0, 255, 136, 0.2)`
  - Primary Accent: `#00FF87` (Neon Green)
  - Gradient: `linear-gradient(135deg, #00FF87 0%, #059669 100%)`
  - Glow Effect: `box-shadow: 0 0 25px rgba(0, 255, 135, 0.35)`
  - Text Primary: `#F8FAFC`
  - Text Secondary: `#94A3B8`
  - Danger: `#FF4D6D`
- **Micro-Animations**:
  - Pulse ring on daily habit completion toggle.
  - Smooth modal backdrop blur and fade-scale transition.
  - Shimmer wave on loading skeleton cards.

---

## 5. Security & Verification Checklist

1. [x] `.env` is listed in `.gitignore` and verified absent from `git status`.
2. [ ] No secret or service-role keys are used; only the public anon key is consumed by the client.
3. [ ] Every database query in `useHabits.ts` uses `.eq('user_id', user.id)` on select/update/delete.
4. [ ] All mutations handle loading and error states with user-visible notifications.
5. [ ] Deleting a habit cascades to delete related rows in `daily_logs`.
6. [ ] Signing in with a fresh secondary account displays an empty habit list rather than an error or foreign records.
7. [ ] Hard-refreshing on `/` preserves the authenticated session and habit list without redirect flashing.
8. [ ] SQL script is ready to run directly in the Supabase SQL Editor.

---

## 6. Attacker Threat Statement

> *"If RLS were disabled once the app is deployed, an attacker could use the public anonymous API key exposed in the browser bundle to directly query, read, overwrite, or delete every user's private habits and daily logs via the Supabase PostgREST API without needing any account credentials."*
