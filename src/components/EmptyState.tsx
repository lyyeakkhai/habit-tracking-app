import React from 'react'
import { Sparkles, Plus } from 'lucide-react'

interface EmptyStateProps {
  onAddHabit: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddHabit }) => {
  return (
    <div className="glass-panel empty-state-card">
      <div className="empty-state-icon">
        <Sparkles size={28} />
      </div>
      <h3 className="empty-state-title">No Habits Tracked Yet</h3>
      <p className="empty-state-desc">
        Your habits and daily logs are completely private and scoped to your account.
        Start building consistency today by creating your first daily or weekly habit!
      </p>
      <button type="button" className="btn btn-neon" onClick={onAddHabit} style={{ marginTop: '8px' }}>
        <Plus size={18} />
        Create Your First Habit
      </button>
    </div>
  )
}

export default EmptyState
