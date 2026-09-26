import React, { useState, useMemo } from 'react'
import { Navbar } from '../components/Navbar'
import { HabitCard } from '../components/HabitCard'
import { HabitModal } from '../components/HabitModal'
import { DeleteModal } from '../components/DeleteModal'
import { EmptyState } from '../components/EmptyState'
import { useHabits } from '../hooks/useHabits'
import type { HabitWithStatus, CreateHabitInput, UpdateHabitInput } from '../types/habit'
import { Plus, RefreshCw, AlertCircle, CheckCircle2, ListFilter } from 'lucide-react'

export const TrackerPage: React.FC = () => {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [habitToEdit, setHabitToEdit] = useState<HabitWithStatus | null>(null)
  const [habitToDelete, setHabitToDelete] = useState<HabitWithStatus | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // Calculate today's completion stats
  const totalCount = habits.length
  const completedCount = useMemo(() => habits.filter((h) => h.completed_today).length, [habits])
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Filtered habits
  const filteredHabits = useMemo(() => {
    switch (filter) {
      case 'completed':
        return habits.filter((h) => h.completed_today)
      case 'pending':
        return habits.filter((h) => !h.completed_today)
      default:
        return habits
    }
  }, [habits, filter])

  const handleOpenAddModal = () => {
    setHabitToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (habit: HabitWithStatus) => {
    setHabitToEdit(habit)
    setIsModalOpen(true)
  }

  const handleSaveHabit = async (data: CreateHabitInput | UpdateHabitInput) => {
    if (habitToEdit) {
      return await updateHabit(habitToEdit.id, data)
    } else {
      return await createHabit(data as CreateHabitInput)
    }
  }

  const handleDeleteConfirm = async (habitId: string) => {
    return await deleteHabit(habitId)
  }

  // Format today's human-readable date
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="app-container">
      <Navbar completedCount={completedCount} totalCount={totalCount} />

      <main className="main-content">
        {/* Dashboard Header */}
        <section className="dashboard-header">
          <div className="header-title-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-neon">{formattedToday}</span>
            </div>
            <h1>Daily Habits</h1>
            <p className="header-subtitle">
              Build your streaks, track consistency, and unlock your potential.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
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

        {/* Today's Progress Bar Card */}
        {totalCount > 0 && (
          <section className="glass-panel progress-card" aria-label="Today's Progress">
            <div className="progress-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--neon-green)" />
                <span style={{ fontWeight: 600 }}>Daily Completion</span>
              </div>
              <span className="font-display" style={{ fontWeight: 700, color: 'var(--neon-green)' }}>
                {completionPercent}% ({completedCount} of {totalCount} completed)
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        {totalCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ListFilter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
            <button
              type="button"
              className={`btn btn-secondary ${filter === 'all' ? 'badge-neon' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={`btn btn-secondary ${filter === 'pending' ? 'badge-neon' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => setFilter('pending')}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              type="button"
              className={`btn btn-secondary ${filter === 'completed' ? 'badge-neon' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>
        )}

        {/* Habits List / Skeleton / Empty State */}
        {loading && habits.length === 0 ? (
          <div className="habits-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel skeleton" style={{ height: '84px' }} />
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
                onToggle={toggleDailyLog}
                onEdit={handleOpenEditModal}
                onDelete={(h) => setHabitToDelete(h)}
                disabled={actionLoading === habit.id}
              />
            ))}
          </section>
        )}
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
    </div>
  )
}

export default TrackerPage
