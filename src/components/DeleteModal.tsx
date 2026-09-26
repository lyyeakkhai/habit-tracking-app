import React, { useState } from 'react'
import type { HabitWithStatus } from '../types/habit'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteModalProps {
  isOpen: boolean
  habit: HabitWithStatus | null
  onClose: () => void
  onConfirm: (habitId: string) => Promise<{ error: Error | null }>
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  habit,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !habit) return null

  const handleDelete = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await onConfirm(habit.id)
      if (res.error) {
        setError(res.error.message)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle color="var(--color-danger)" size={22} />
            <h2>Delete Habit</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Are you sure you want to delete <strong>"{habit.name}"</strong>?
        </p>

        <div className="delete-warning-box">
          <strong>Database Cascade Notice:</strong> Because of the{' '}
          <code>ON DELETE CASCADE</code> foreign key constraint, deleting this habit will
          permanently remove all of its historical daily logs and streaks.
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
