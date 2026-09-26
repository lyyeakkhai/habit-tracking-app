import React from 'react'
import type { HabitWithStatus } from '../types/habit'
import { Check, Flame, Edit3, Trash2, Calendar, WifiOff } from 'lucide-react'
import { ShareButton } from './ShareButton'

interface HabitCardProps {
  habit: HabitWithStatus & { is_queued?: boolean }
  onToggle: (habitId: string, currentCompleted: boolean) => void
  onEdit: (habit: HabitWithStatus) => void
  onDelete: (habit: HabitWithStatus) => void
  disabled?: boolean
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggle,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const shareText = `I'm building a streak on HABIT//PULSE: "${habit.name}" (${habit.current_streak} ${habit.current_streak === 1 ? 'day' : 'days'} streak)!`

  return (
    <div className={`glass-panel habit-card ${habit.completed_today ? 'completed-today' : ''}`}>
      <div className="habit-top-row">
        <button
          type="button"
          className={`check-toggle ${habit.completed_today ? 'active' : ''}`}
          onClick={() => onToggle(habit.id, habit.completed_today)}
          disabled={disabled}
          title={habit.completed_today ? 'Mark incomplete for today' : 'Mark complete for today'}
          aria-label={`${habit.completed_today ? 'Uncheck' : 'Check'} ${habit.name}`}
        >
          <Check size={22} strokeWidth={3} />
        </button>

        <div className="habit-info">
          <div className="habit-title-row">
            <h3 className="habit-name">
              {habit.name}
            </h3>
            {habit.current_streak > 0 && (
              <span className="badge badge-streak" title={`Current streak: ${habit.current_streak} days`}>
                <Flame size={12} fill="#ffb800" />
                {habit.current_streak} {habit.current_streak === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>

          {habit.description && (
            <p className="habit-description">
              {habit.description}
            </p>
          )}

          <div className="habit-meta">
            <span className="badge badge-muted">
              <Calendar size={11} />
              {habit.frequency}
            </span>
            {habit.target_streak > 0 && (
              <span className="badge badge-muted">
                Goal: {habit.target_streak} days
              </span>
            )}
            {habit.is_queued && (
              <span className="badge badge-offline-queued">
                <WifiOff size={11} />
                Queued Offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="habit-actions">
        <ShareButton
          title={`HABIT//PULSE: ${habit.name}`}
          text={shareText}
          url={typeof window !== 'undefined' ? window.location.origin : ''}
          iconOnly
          className="btn btn-secondary btn-icon"
          ariaLabel={`Share habit ${habit.name}`}
        />
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => onEdit(habit)}
          title="Edit habit details"
          aria-label={`Edit ${habit.name}`}
        >
          <Edit3 size={15} />
        </button>
        <button
          type="button"
          className="btn btn-danger btn-icon"
          onClick={() => onDelete(habit)}
          title="Delete habit"
          aria-label={`Delete ${habit.name}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default HabitCard
