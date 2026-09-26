import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, LogOut, Camera } from 'lucide-react'

interface NavbarProps {
  completedCount?: number
  totalCount?: number
  avatarUrl?: string | null
  onOpenAvatarModal?: () => void
  onSimulateCrash?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  completedCount = 0,
  totalCount = 0,
  avatarUrl = null,
  onOpenAvatarModal,
  onSimulateCrash,
}) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'HP'

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

          {/* User Profile & Avatar Pill */}
          {user?.email && (
            <div
              className="nav-user-pill"
              onClick={onOpenAvatarModal}
              title={`Signed in as ${user.email}. Click to change avatar.`}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenAvatarModal?.()}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User Avatar"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--neon-green)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 230, 118, 0.2)',
                    color: 'var(--neon-green)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--neon-green)',
                  }}
                >
                  {initials}
                </div>
              )}
              <span>{user.email}</span>
              <Camera size={13} color="var(--text-muted)" style={{ marginLeft: '2px' }} />
            </div>
          )}

          {onSimulateCrash && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={onSimulateCrash}
              title="Test Error Boundary in Navigation"
            >
              💥 Crash Nav
            </button>
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
