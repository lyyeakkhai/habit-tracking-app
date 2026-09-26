-- ==============================================================================
-- CAPSTONE HABIT TRACKER: DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Enable UUID generation extension if needed
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
-- Clause breakdown:
--   USING: Evaluated on existing rows (SELECT, UPDATE, DELETE).
--   WITH CHECK: Evaluated on new/modified row content (INSERT, UPDATE).
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
