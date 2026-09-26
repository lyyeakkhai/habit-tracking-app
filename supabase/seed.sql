-- ==============================================================================
-- CAPSTONE HABIT TRACKER: SEED DATA
-- Run this AFTER creating a user account in your app / Supabase Auth.
-- Replace 'REPLACE_WITH_YOUR_USER_ID' with your actual user UID from auth.users
-- (or run the dynamic DO block below while signed in)
-- ==============================================================================

DO $$
DECLARE
    target_user_id UUID;
    habit_1_id UUID;
    habit_2_id UUID;
    habit_3_id UUID;
BEGIN
    -- Select the first registered user from auth.users (if any exists)
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in auth.users. Please sign up an account in the app first, then re-run seed.sql!';
    ELSE
        RAISE NOTICE 'Seeding habits and daily logs for user_id: %', target_user_id;

        -- Insert Habit 1: Morning Meditation
        INSERT INTO public.habits (user_id, name, description, frequency, target_streak)
        VALUES (target_user_id, 'Morning Meditation', '15 minutes of mindfulness and breathing', 'daily', 14)
        RETURNING id INTO habit_1_id;

        -- Insert Habit 2: Code 1 Hour Daily
        INSERT INTO public.habits (user_id, name, description, frequency, target_streak)
        VALUES (target_user_id, 'Code 1 Hour Daily', 'Build capstone features & practice React', 'daily', 30)
        RETURNING id INTO habit_2_id;

        -- Insert Habit 3: Drink 3L Water
        INSERT INTO public.habits (user_id, name, description, frequency, target_streak)
        VALUES (target_user_id, 'Drink 3L Water', 'Stay hydrated throughout the day', 'daily', 7)
        RETURNING id INTO habit_3_id;

        -- Seed Daily Logs for Habit 1 (Completed today and yesterday)
        INSERT INTO public.daily_logs (habit_id, user_id, log_date, completed, notes)
        VALUES 
            (habit_1_id, target_user_id, CURRENT_DATE, true, 'Felt very calm and focused'),
            (habit_1_id, target_user_id, CURRENT_DATE - INTERVAL '1 day', true, 'Session done before breakfast')
        ON CONFLICT (habit_id, log_date) DO NOTHING;

        -- Seed Daily Logs for Habit 2 (Completed today)
        INSERT INTO public.daily_logs (habit_id, user_id, log_date, completed, notes)
        VALUES 
            (habit_2_id, target_user_id, CURRENT_DATE, true, 'Configured Supabase RLS policies')
        ON CONFLICT (habit_id, log_date) DO NOTHING;

        RAISE NOTICE 'Successfully seeded 3 habits and daily logs for user %', target_user_id;
    END IF;
END $$;
