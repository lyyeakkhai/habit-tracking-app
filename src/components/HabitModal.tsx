import React, { useState, useEffect } from 'react'
import type { HabitWithStatus, CreateHabitInput, UpdateHabitInput } from '../types/habit'
import { X, AlertCircle } from './icons'

interface HabitModalProps {
  isOpen: boolean
  habitToEdit?: HabitWithStatus | null
  onClose: () => void
  onSave: (data: CreateHabitInput | UpdateHabitInput) => Promise<{ error: Error | null }>
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  habitToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [targetStreak, setTargetStreak] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name)
      setDescription(habitToEdit.description || '')
      setFrequency(habitToEdit.frequency)
      setTargetStreak(habitToEdit.target_streak || 7)
    } else {
      setName('')
      setDescription('')
      setFrequency('daily')
      setTargetStreak(7)
    }
    setError(null)
  }, [habitToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Habit name is required.')
      return
    }

    try {
      setLoading(true)
      const res = await onSave({
        name: name.trim(),
        description: description.trim(),
        frequency,
        target_streak: Number(targetStreak) || 7,
      })

      if (res.error) {
        setError(res.error.message)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habitToEdit ? 'Edit Habit' : 'New Habit'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="habit-name">
              Habit Name *
            </label>
            <input
              id="habit-name"
              type="text"
              className="form-input"
              placeholder="e.g. Read 20 pages"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-description">
              Description (Optional)
            </label>
            <input
              id="habit-description"
              type="text"
              className="form-input"
              placeholder="e.g. In the evening before sleep"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="habit-frequency">
                Frequency
              </label>
              <select
                id="habit-frequency"
                className="form-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
                disabled={loading}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-target-streak">
                Target Streak (Days)
              </label>
              <input
                id="habit-target-streak"
                type="number"
                className="form-input"
                min="1"
                max="365"
                value={targetStreak}
                onChange={(e) => setTargetStreak(parseInt(e.target.value, 10) || 1)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-neon" disabled={loading}>
              {loading ? 'Saving...' : habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HabitModal
