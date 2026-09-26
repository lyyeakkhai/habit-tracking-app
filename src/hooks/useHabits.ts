import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Habit, DailyLog, HabitWithStatus, CreateHabitInput, UpdateHabitInput } from '../types/habit'

const getTodayDateString = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const useHabits = () => {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // holds ID of habit currently being modified

  const todayStr = useMemo(() => getTodayDateString(), [])

  // Calculate consecutive active streak for a habit
  const calculateStreak = useCallback((habitId: string, logs: DailyLog[]): number => {
    const habitLogs = logs
      .filter((l) => l.habit_id === habitId && l.completed)
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

    if (habitLogs.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mostRecentDate = new Date(habitLogs[0].log_date)
    mostRecentDate.setHours(0, 0, 0, 0)

    // Streak is alive only if most recent completion is today or yesterday
    if (mostRecentDate.getTime() < yesterday.getTime()) {
      return 0
    }

    let streak = 0
    let checkDate = mostRecentDate

    for (const log of habitLogs) {
      const logDate = new Date(log.log_date)
      logDate.setHours(0, 0, 0, 0)

      const diffDays = Math.round((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0 || diffDays === 1) {
        streak++
        checkDate = logDate
      } else {
        break
      }
    }

    return streak
  }, [])

  // Fetch habits and all logs strictly scoped to current user.id
  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([])
      setDailyLogs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Fetch habits scoped with .eq('user_id', user.id)
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (habitsError) {
        throw habitsError
      }

      // 2. Fetch daily logs scoped with .eq('user_id', user.id)
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (logsError) {
        throw logsError
      }

      setHabits(habitsData as Habit[] || [])
      setDailyLogs(logsData as DailyLog[] || [])
    } catch (err: unknown) {
      console.error('Error fetching habit data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch habits from database.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch when user becomes available
  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // Combine habits with today's status & streaks
  const habitsWithStatus: HabitWithStatus[] = useMemo(() => {
    return habits.map((habit) => {
      const todayLog = dailyLogs.find(
        (log) => log.habit_id === habit.id && log.log_date === todayStr && log.completed
      )
      const streak = calculateStreak(habit.id, dailyLogs)

      return {
        ...habit,
        completed_today: Boolean(todayLog),
        current_streak: streak,
        today_log_id: todayLog?.id,
      }
    })
  }, [habits, dailyLogs, todayStr, calculateStreak])

  // Create a new habit
  const createHabit = async (input: CreateHabitInput): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setActionLoading('create')
      setError(null)

      const { data, error: insertError } = await supabase
        .from('habits')
        .insert([
          {
            name: input.name.trim(),
            description: input.description?.trim() || '',
            frequency: input.frequency || 'daily',
            target_streak: input.target_streak || 7,
            user_id: user.id, // Explicit user scoping
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      setHabits((prev) => [data as Habit, ...prev])
      return { error: null }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Failed to create habit')
      setError(e.message)
      return { error: e }
    } finally {
      setActionLoading(null)
    }
  }

  // Update an existing habit
  const updateHabit = async (id: string, input: UpdateHabitInput): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setActionLoading(id)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('habits')
        .update({
          name: input.name?.trim(),
          description: input.description?.trim(),
          frequency: input.frequency,
          target_streak: input.target_streak,
        })
        .eq('id', id)
        .eq('user_id', user.id) // Scoped to id AND user_id
        .select()
        .single()

      if (updateError) throw updateError

      setHabits((prev) => prev.map((h) => (h.id === id ? (data as Habit) : h)))
      return { error: null }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Failed to update habit')
      setError(e.message)
      return { error: e }
    } finally {
      setActionLoading(null)
    }
  }

  // Delete a habit (cascades to daily_logs on the DB)
  const deleteHabit = async (id: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setActionLoading(id)
      setError(null)

      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Scoped to id AND user_id

      if (deleteError) throw deleteError

      // Remove habit and its associated logs locally
      setHabits((prev) => prev.filter((h) => h.id !== id))
      setDailyLogs((prev) => prev.filter((l) => l.habit_id !== id))
      return { error: null }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Failed to delete habit')
      setError(e.message)
      return { error: e }
    } finally {
      setActionLoading(null)
    }
  }

  // Toggle today's completion log with optimistic local update
  const toggleDailyLog = async (habitId: string, currentCompleted: boolean) => {
    if (!user) return

    const newCompleted = !currentCompleted

    // Optimistic UI update
    setDailyLogs((prev) => {
      if (newCompleted) {
        // Add or update optimistic log
        const existing = prev.find((l) => l.habit_id === habitId && l.log_date === todayStr)
        if (existing) {
          return prev.map((l) =>
            l.habit_id === habitId && l.log_date === todayStr ? { ...l, completed: true } : l
          )
        }
        const optimisticLog: DailyLog = {
          id: `temp-${Date.now()}`,
          habit_id: habitId,
          user_id: user.id,
          log_date: todayStr,
          completed: true,
          notes: '',
          created_at: new Date().toISOString(),
        }
        return [optimisticLog, ...prev]
      } else {
        // Remove or set false
        return prev.filter((l) => !(l.habit_id === habitId && l.log_date === todayStr))
      }
    })

    try {
      if (newCompleted) {
        const { error: upsertError } = await supabase
          .from('daily_logs')
          .upsert(
            {
              habit_id: habitId,
              user_id: user.id, // Explicit user scoping
              log_date: todayStr,
              completed: true,
              notes: '',
            },
            { onConflict: 'habit_id,log_date' }
          )

        if (upsertError) throw upsertError
      } else {
        const { error: deleteError } = await supabase
          .from('daily_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('log_date', todayStr)
          .eq('user_id', user.id) // Scoped to user_id

        if (deleteError) throw deleteError
      }
    } catch (err) {
      console.error('Error toggling daily log on database:', err)
      // Revert on error by refetching
      fetchHabits()
    }
  }

  return {
    habits: habitsWithStatus,
    rawHabits: habits,
    loading,
    error,
    actionLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDailyLog,
    refreshHabits: fetchHabits,
  }
}

export default useHabits
