import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { HabitWithStatus } from '../types/habit'
import { shareHabit } from '../lib/platformShare'
import { supabase } from '../lib/supabase'

const INITIAL_FALLBACK_HABITS: HabitWithStatus[] = [
  {
    id: 'demo-1',
    user_id: 'local',
    name: 'Morning Meditation & Zen Focus',
    description: '15 minutes of mindfulness before booting into the terminal.',
    frequency: 'daily',
    target_streak: 14,
    current_streak: 5,
    completed_today: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'local',
    name: 'Deep Work Sprint (90m)',
    description: 'Uninterrupted algorithmic problem solving with zero notifications.',
    frequency: 'daily',
    target_streak: 30,
    current_streak: 12,
    completed_today: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'local',
    name: 'Hydration & Posture Reset',
    description: 'Drink 500ml water and 2-minute posture stretch.',
    frequency: 'daily',
    target_streak: 7,
    current_streak: 3,
    completed_today: false,
    created_at: new Date().toISOString(),
  },
]

export default function HabitListScreen() {
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithStatus[]>(INITIAL_FALLBACK_HABITS)
  const [refreshing, setRefreshing] = useState(false)

  const loadHabits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const enriched: HabitWithStatus[] = data.map((h: any) => ({
          ...h,
          current_streak: h.current_streak || 0,
          completed_today: false,
        }))
        setHabits(enriched)
      }
    } catch {
      // Fallback remains active if offline or unauthenticated
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadHabits()
    }, [loadHabits])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadHabits()
    setRefreshing(false)
  }

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const nextCompleted = !habit.completed_today
          const nextStreak = nextCompleted
            ? habit.current_streak + 1
            : Math.max(0, habit.current_streak - 1)
          return {
            ...habit,
            completed_today: nextCompleted,
            current_streak: nextStreak,
          }
        }
        return habit
      })
    )
  }

  const handleShare = async (habit: HabitWithStatus) => {
    await shareHabit({
      title: `HABIT//PULSE: ${habit.name}`,
      text: `Building a streak on HABIT//PULSE: "${habit.name}" (${habit.current_streak} days streak)!`,
    })
  }

  const renderHabitItem = ({ item }: { item: HabitWithStatus }) => (
    <View style={[styles.card, item.completed_today && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <Pressable
          style={[styles.checkbox, item.completed_today && styles.checkboxActive]}
          onPress={() => toggleHabit(item.id)}
          accessibilityLabel={`Toggle habit ${item.name}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed_today }}
        >
          {item.completed_today && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={[styles.habitTitle, item.completed_today && styles.habitTitleDone]}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.habitDescription}>{item.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.badgesContainer}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {item.current_streak}d</Text>
          </View>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>{item.frequency.toUpperCase()}</Text>
          </View>
          {item.target_streak > 0 && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalText}>GOAL: {item.target_streak}d</Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.shareButton}
          onPress={() => handleShare(item)}
          accessibilityLabel={`Share ${item.name}`}
        >
          <Text style={styles.shareButtonText}>SHARE</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>DAILY DISCIPLINE PROTOCOL</Text>
          <Text style={styles.headerTitle}>ACTIVE HABITS</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
          <Text style={styles.addButtonText}>+ ADD</Text>
        </Pressable>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00e676"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>NO ACTIVE PROTOCOLS FOUND</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#121824',
  },
  headerSubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#00e5ff',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: '#00e676',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#05070a',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#0a0e14',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  cardCompleted: {
    borderColor: '#00e676',
    backgroundColor: '#0a1612',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#00e676',
    borderColor: '#00e676',
  },
  checkmark: {
    color: '#05070a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  habitDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#121824',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: '#261b05',
    borderColor: '#ffb800',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  streakText: {
    color: '#ffb800',
    fontSize: 11,
    fontWeight: '700',
  },
  frequencyBadge: {
    backgroundColor: '#121824',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  frequencyText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  goalBadge: {
    backgroundColor: '#121824',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goalText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#121824',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    letterSpacing: 1.5,
  },
})
