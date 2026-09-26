import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import type { CreateHabitInput } from '../types/habit'

const QUEUE_STORAGE_KEY = 'habit_offline_queue_v1'

export interface QueuedOfflineHabit extends CreateHabitInput {
  tempId: string
  userId: string
  createdAt: string
}

export function useNetworkStatus(onSynced?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncSuccessNotice, setSyncSuccessNotice] = useState<string | null>(null)

  // Retrieve queued items from localStorage
  const getQueuedHabits = useCallback((): QueuedOfflineHabit[] => {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to parse offline queue:', e)
      return []
    }
  }, [])

  // Save queued habit offline
  const enqueueHabit = useCallback((habit: CreateHabitInput, userId: string): QueuedOfflineHabit => {
    const queuedItem: QueuedOfflineHabit = {
      ...habit,
      tempId: 'offline_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    }

    const currentQueue = getQueuedHabits()
    const updated = [...currentQueue, queuedItem]
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
    return queuedItem
  }, [getQueuedHabits])

  // Remove queued habit offline (e.g. if deleted before sync)
  const dequeueHabit = useCallback((tempId: string) => {
    const currentQueue = getQueuedHabits()
    const updated = currentQueue.filter((item) => item.tempId !== tempId)
    if (updated.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    }
  }, [getQueuedHabits])

  // Sync all queued habits to Supabase upon reconnecting
  const syncQueuedHabits = useCallback(async () => {
    const queue = getQueuedHabits()
    if (queue.length === 0) return

    setIsSyncing(true)
    let syncedCount = 0
    const remainingItems: QueuedOfflineHabit[] = []

    try {
      for (const item of queue) {
        const { error } = await supabase.from('habits').insert({
          user_id: item.userId,
          name: item.name,
          description: item.description || '',
          frequency: item.frequency || 'daily',
          target_streak: item.target_streak || 7,
        })

        if (!error) {
          syncedCount++
        } else {
          console.error('Failed to sync offline habit to Supabase:', error.message)
          remainingItems.push(item)
        }
      }

      // Update or clear queue once synced
      if (remainingItems.length > 0) {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingItems))
      } else {
        localStorage.removeItem(QUEUE_STORAGE_KEY)
      }

      if (syncedCount > 0) {
        setSyncSuccessNotice(`Synchronized ${syncedCount} offline habit${syncedCount > 1 ? 's' : ''} to database!`)
        setTimeout(() => setSyncSuccessNotice(null), 4000)
      }

      if (onSynced) {
        onSynced()
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [getQueuedHabits, onSynced])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // When connection is restored, immediately sync queued items
      syncQueuedHabits()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if we started online but have lingering items to sync
    if (navigator.onLine) {
      syncQueuedHabits()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncQueuedHabits])

  return {
    isOnline,
    isSyncing,
    syncSuccessNotice,
    getQueuedHabits,
    enqueueHabit,
    dequeueHabit,
    syncQueuedHabits,
  }
}
