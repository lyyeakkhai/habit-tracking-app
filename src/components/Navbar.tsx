import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, LogOut } from 'lucide-react'

interface NavbarProps {
  completedCount?: number
  totalCount?: number
}

export const Navbar: React.FC<NavbarProps> = ({ completedCount = 0, totalCount = 0 }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand">
          <div className="nav-logo-icon">
            <Zap size={18} fill="#031208" />
          </div>
          <span className="nav-brand-title">
            HABIT<span className="nav-brand-pulse">//PULSE</span>
          </span>
        </div>

        <div className="nav-actions">
          {totalCount > 0 && (
            <div className="badge badge-neon" title="Today's habit completion status">
              <span>{completedCount}/{totalCount} DONE</span>
            </div>
          )}

          {user?.email && (
            <div className="nav-user-pill" title={`Signed in as ${user.email}`}>
              <div className="nav-user-dot" />
              <span>{user.email}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={handleSignOut}
            title="Sign out of your account"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
