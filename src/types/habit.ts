export interface Habit {
  id: string
  user_id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly'
  target_streak: number
  created_at: string
}

export interface DailyLog {
  id: string
  habit_id: string
  user_id: string
  log_date: string
  completed: boolean
  notes: string
  created_at: string
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean
  current_streak: number
  today_log_id?: string
  is_queued?: boolean
}

export interface CreateHabitInput {
  name: string
  description?: string
  frequency?: 'daily' | 'weekly'
  target_streak?: number
}

export interface UpdateHabitInput {
  name?: string
  description?: string
  frequency?: 'daily' | 'weekly'
  target_streak?: number
}
