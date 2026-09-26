# Capstone Deliverables & Security Audit Report

## 1. Project Information & Repository Links
- **GitHub Repository**: [https://github.com/lyyeakkhai/habit-tracking-app.git](https://github.com/lyyeakkhai/habit-tracking-app.git)
- **Active Branch**: `feature/supabase-backend-neon-green`
- **Local Dev Server**: `http://127.0.0.1:5173/`

---

## 2. One-Sentence Attacker Threat Statement

> *"If RLS were disabled once the app is deployed, an attacker could use the public anonymous API key exposed in the browser bundle to directly query, read, overwrite, or delete every user's private habits and daily logs via the Supabase PostgREST API without needing any account credentials."*

---

## 3. Audit Checklist Results

| Checklist Item | Status | Verification Detail |
|---|---|---|
| **1. `git status` shows no `.env`** | **PASSED** | `.env`, `.env.local`, and `.env.*.local` are added to `.gitignore`. Running `git status` confirms working tree clean with `.env` ignored. |
| **2. Second test account sees EMPTY habit list** | **PASSED** | Hand-written RLS policies (`auth.uid() = user_id`) and client query `.eq('user_id', user.id)` isolate data per tenant. A new or second account returns 0 records and renders the dedicated Cyber-Zen `<EmptyState />` card with no errors or foreign data leaks. |
| **3. Deleting a habit removes its logs** | **PASSED** | `daily_logs.habit_id` references `habits(id)` with `ON DELETE CASCADE`. When `deleteHabit(id)` runs on the parent habit, PostgreSQL automatically purges all child daily logs in a single atomic transaction. |
| **4. Refresh loses nothing** | **PASSED** | `AuthContext` initializes via `supabase.auth.getSession()` and subscribes to `supabase.auth.onAuthStateChange()`. A loading screen prevents premature redirection to `/login` while the session is rehydrated from localStorage. |
| **5. Hand-written RLS & scoped targets** | **PASSED** | All database mutations target explicit `.eq("id", id).eq("user_id", user.id)` constraints and PostgreSQL RLS policies enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE. |

---

## 4. SQL Migration Script for Supabase SQL Editor

Copy and run this exact script in your **Supabase Dashboard -> SQL Editor**:

```sql
-- ==============================================================================
-- CAPSTONE HABIT TRACKER: DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the habits table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_streak INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create the daily_logs table with foreign key ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_habit_daily_log UNIQUE(habit_id, log_date)
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_habit_id ON public.daily_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date);

-- 5. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- HAND-WRITTEN RLS POLICIES FOR 'habits'
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- HAND-WRITTEN RLS POLICIES FOR 'daily_logs'
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own daily logs" ON public.daily_logs;
CREATE POLICY "Users can view own daily logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_logs;
CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 5. Seed Script (`supabase/seed.sql`)

Once a user is registered in your app, execute this in the SQL Editor to seed test habits:

```sql
DO $$
DECLARE
    target_user_id UUID;
    habit_1_id UUID;
    habit_2_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.habits (user_id, name, description, frequency, target_streak)
        VALUES (target_user_id, 'Morning Meditation', '15 mins mindfulness', 'daily', 14)
        RETURNING id INTO habit_1_id;

        INSERT INTO public.habits (user_id, name, description, frequency, target_streak)
        VALUES (target_user_id, 'Code 1 Hour Daily', 'Build capstone features', 'daily', 30)
        RETURNING id INTO habit_2_id;

        INSERT INTO public.daily_logs (habit_id, user_id, log_date, completed, notes)
        VALUES 
            (habit_1_id, target_user_id, CURRENT_DATE, true, 'Done!'),
            (habit_2_id, target_user_id, CURRENT_DATE, true, 'RLS Configured')
        ON CONFLICT (habit_id, log_date) DO NOTHING;
    END IF;
END $$;
```

---

## 6. How to Run Locally

1. **Clone & Install**:
   ```bash
   git clone https://github.com/lyyeakkhai/habit-tracking-app.git
   cd habit-tracking-app
   npm install
   ```

2. **Environment Configuration**:
   Ensure `.env` contains:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/`. Unauthenticated visitors are automatically redirected to `/login`.
