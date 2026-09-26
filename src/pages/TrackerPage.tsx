import React, { useState, useMemo, useCallback } from 'react'
import { Navbar } from '../components/Navbar'
import { HabitCard } from '../components/HabitCard'
import { HabitModal } from '../components/HabitModal'
import { DeleteModal } from '../components/DeleteModal'
import { EmptyState } from '../components/EmptyState'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AvatarUploadModal } from '../components/AvatarUploadModal'
import { OfflineBanner } from '../components/OfflineBanner'
import { useHabits } from '../hooks/useHabits'
import { useProfile } from '../hooks/useProfile'
import { useNetworkStatus, getQueuedHabits } from '../hooks/useNetworkStatus'
import { useAuth } from '../context/AuthContext'
import type { HabitWithStatus, CreateHabitInput, UpdateHabitInput } from '../types/habit'
import { Plus, RefreshCw, AlertCircle, CheckCircle2, ListFilter, ShieldAlert } from 'lucide-react'

// Crash simulation component to test error boundary resilience
const BuggyComponent: React.FC<{ section: string }> = ({ section }) => {
  throw new Error(`Deliberate crash simulation in ${section}: Real apps take punches, but the rest of the page survives!`)
}

export const TrackerPage: React.FC = () => {
  const { user } = useAuth()
  const {
    habits,
    loading,
    error,
    actionLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDailyLog,
    refreshHabits,
  } = useHabits()

  const { avatarUrl, uploadAvatar } = useProfile()

  // Offline queued habits for immediate optimistic UI rendering
  const [localQueuedHabits, setLocalQueuedHabits] = useState<HabitWithStatus[]>(() => {
    const data = getQueuedHabits()
    const userQueue = user ? data.filter((item) => item.userId === user.id) : data
    return userQueue.map((item) => ({
      id: item.tempId,
      user_id: item.userId,
      name: item.name || 'Untitled Habit',
      description: item.description || '',
      frequency: item.frequency || 'daily',
      target_streak: item.target_streak || 7,
      created_at: item.createdAt || new Date().toISOString(),
      current_streak: 0,
      completed_today: false,
      is_queued: true,
    }))
  })

  // Handler called when offline habits finish syncing
  const handleSynced = useCallback(() => {
    // Re-sync localQueuedHabits from getQueuedHabits in case any items failed to sync
    const remaining = getQueuedHabits()
    const userRemaining = user ? remaining.filter((item) => item.userId === user.id) : remaining
    setLocalQueuedHabits(
      userRemaining.map((item) => ({
        id: item.tempId,
        user_id: item.userId,
        name: item.name || 'Untitled Habit',
        description: item.description || '',
        frequency: item.frequency || 'daily',
        target_streak: item.target_streak || 7,
        created_at: item.createdAt || new Date().toISOString(),
        current_streak: 0,
        completed_today: false,
        is_queued: true,
      }))
    )
    refreshHabits()
  }, [user, refreshHabits])

  const { isOnline, isSyncing, syncSuccessNotice, enqueueHabit, dequeueHabit } = useNetworkStatus(handleSynced)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [habitToEdit, setHabitToEdit] = useState<HabitWithStatus | null>(null)
  const [habitToDelete, setHabitToDelete] = useState<HabitWithStatus | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // Error boundary simulation state
  const [crashedSection, setCrashedSection] = useState<'nav' | 'stats' | 'habits' | null>(null)

  // Merge server habits with any locally queued offline habits
  const combinedHabits = useMemo(() => {
    return [...localQueuedHabits, ...habits]
  }, [localQueuedHabits, habits])

  // Calculate today's completion stats
  const totalCount = combinedHabits.length
  const completedCount = useMemo(() => combinedHabits.filter((h) => h.completed_today).length, [combinedHabits])
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Filtered habits
  const filteredHabits = useMemo(() => {
    switch (filter) {
      case 'completed':
        return combinedHabits.filter((h) => h.completed_today)
      case 'pending':
        return combinedHabits.filter((h) => !h.completed_today)
      default:
        return combinedHabits
    }
  }, [combinedHabits, filter])

  const handleOpenAddModal = () => {
    setHabitToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (habit: HabitWithStatus) => {
    setHabitToEdit(habit)
    setIsModalOpen(true)
  }

  const handleSaveHabit = async (data: CreateHabitInput | UpdateHabitInput) => {
    // If user is offline, save habit to offline queue
    if (!isOnline && !habitToEdit && user) {
      const queuedItem = enqueueHabit(data as CreateHabitInput, user.id)
      const optimisticHabit: HabitWithStatus = {
        id: queuedItem.tempId,
        user_id: user.id,
        name: data.name || 'Untitled Habit',
        description: data.description || '',
        frequency: data.frequency || 'daily',
        target_streak: data.target_streak || 7,
        created_at: new Date().toISOString(),
        current_streak: 0,
        completed_today: false,
        is_queued: true,
      }
      setLocalQueuedHabits((prev) => [optimisticHabit, ...prev])
      return { error: null }
    }

    if (habitToEdit) {
      return await updateHabit(habitToEdit.id, data)
    } else {
      return await createHabit(data as CreateHabitInput)
    }
  }

  const handleDeleteConfirm = async (habitId: string) => {
    // If it's a locally queued habit, remove from local queue and localStorage
    if (habitId.startsWith('offline_')) {
      dequeueHabit(habitId)
      setLocalQueuedHabits((prev) => prev.filter((h) => h.id !== habitId))
      return { error: null }
    }
    return await deleteHabit(habitId)
  }

  // Format today's human-readable date
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  const queuedCount = localQueuedHabits.length

  return (
    <div className="app-container" style={{ overflowX: 'hidden', minWidth: '320px', width: '100%' }}>
      {/* Offline Banner driven by online/offline events */}
      <OfflineBanner
        isOnline={isOnline}
        isSyncing={isSyncing}
        syncSuccessNotice={syncSuccessNotice}
        queuedCount={queuedCount}
      />

      {/* 1. Navigation Section wrapped in ErrorBoundary */}
      <ErrorBoundary
        sectionName="Navigation"
        onReset={() => setCrashedSection(null)}
      >
        {crashedSection === 'nav' ? (
          <BuggyComponent section="Navigation" />
        ) : (
          <Navbar
            completedCount={completedCount}
            totalCount={totalCount}
            avatarUrl={avatarUrl}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          />
        )}
      </ErrorBoundary>

      <main className="main-content" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '1024px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Error Boundary Testing Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.85rem',
            border: '1px dashed rgba(0, 230, 118, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="var(--neon-green)" />
            <span style={{ fontWeight: 600 }}>Error Boundary Controls:</span>
            <span style={{ color: 'var(--text-muted)' }}>Crash section to verify app survives</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => setCrashedSection(crashedSection === 'stats' ? null : 'stats')}
            >
              {crashedSection === 'stats' ? 'Restore Stats' : '💥 Crash Stats'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => setCrashedSection(crashedSection === 'habits' ? null : 'habits')}
            >
              {crashedSection === 'habits' ? 'Restore Habits' : '💥 Crash Habits'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => setCrashedSection(crashedSection === 'nav' ? null : 'nav')}
            >
              {crashedSection === 'nav' ? 'Restore Nav' : '💥 Crash Nav'}
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <section className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div className="header-title-section" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-neon">{formattedToday}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800 }}>Daily Habits</h1>
            <p className="header-subtitle" style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Build your streaks, track consistency, and unlock your potential.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={refreshHabits}
              title="Refresh habit data"
              aria-label="Refresh habits"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'neon-spinner' : ''} />
            </button>
            <button type="button" className="btn btn-neon" onClick={handleOpenAddModal}>
              <Plus size={18} />
              New Habit
            </button>
          </div>
        </section>

        {/* Global Error Banner */}
        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{error}</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={refreshHabits}
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Today's Progress Stats Section wrapped in ErrorBoundary */}
        <ErrorBoundary
          sectionName="Statistics"
          onReset={() => setCrashedSection(null)}
        >
          {crashedSection === 'stats' ? (
            <BuggyComponent section="Statistics" />
          ) : (
            totalCount > 0 && (
              <section className="glass-panel progress-card" aria-label="Today's Progress" style={{ marginBottom: '24px' }}>
                <div className="progress-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--neon-green)" />
                    <span style={{ fontWeight: 600 }}>Daily Completion</span>
                  </div>
                  <span className="font-display" style={{ fontWeight: 700, color: 'var(--neon-green)' }}>
                    {completionPercent}% ({completedCount} of {totalCount} completed)
                  </span>
                </div>
                <div className="progress-bar-bg" style={{ marginTop: '10px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </section>
            )
          )}
        </ErrorBoundary>

        {/* Filter Tabs */}
        {totalCount > 0 && (
          <div className="filter-bar">
            <ListFilter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
            <button
              type="button"
              className={`btn btn-secondary filter-btn ${filter === 'all' ? 'badge-neon' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={`btn btn-secondary filter-btn ${filter === 'pending' ? 'badge-neon' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              type="button"
              className={`btn btn-secondary filter-btn ${filter === 'completed' ? 'badge-neon' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>
        )}

        {/* 3. Habits List Section wrapped in ErrorBoundary (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) */}
        <ErrorBoundary
          sectionName="Habit List"
          onReset={() => setCrashedSection(null)}
        >
          {crashedSection === 'habits' ? (
            <BuggyComponent section="Habit List" />
          ) : loading && combinedHabits.length === 0 ? (
            <div className="habits-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel skeleton" style={{ height: '120px' }} />
              ))}
            </div>
          ) : filteredHabits.length === 0 ? (
            filter === 'all' ? (
              <EmptyState onAddHabit={handleOpenAddModal} />
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No {filter} habits right now.
                </p>
              </div>
            )
          ) : (
            <section className="habits-grid" aria-label="Habits List">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={(habitId, currentCompleted) => {
                    if (habitId.startsWith('offline_')) {
                      setLocalQueuedHabits((prev) =>
                        prev.map((h) => (h.id === habitId ? { ...h, completed_today: !currentCompleted } : h))
                      )
                      return
                    }
                    toggleDailyLog(habitId, currentCompleted)
                  }}
                  onEdit={handleOpenEditModal}
                  onDelete={(h) => setHabitToDelete(h)}
                  disabled={actionLoading === habit.id}
                />
              ))}
            </section>
          )}
        </ErrorBoundary>
      </main>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        habitToEdit={habitToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
      />

      {/* Delete Confirmation Modal with Cascade Warning */}
      <DeleteModal
        isOpen={Boolean(habitToDelete)}
        habit={habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        userEmail={user?.email || null}
        onUpload={uploadAvatar}
      />
    </div>
  )
}

export default TrackerPage
