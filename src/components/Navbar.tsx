import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, LogOut, Camera } from 'lucide-react'
import { InstallPwaButton } from './InstallPwaButton'
import { ShareButton } from './ShareButton'

interface NavbarProps {
  completedCount?: number
  totalCount?: number
  avatarUrl?: string | null
  onOpenAvatarModal?: () => void
  onOpenInstallGuide?: () => void
  onSimulateCrash?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  completedCount = 0,
  totalCount = 0,
  avatarUrl = null,
  onOpenAvatarModal,
  onOpenInstallGuide,
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
            <div className="badge badge-neon nav-badge" title="Today's habit completion status">
              <span>{completedCount}/{totalCount} <span className="nav-badge-text">DONE</span></span>
            </div>
          )}

          {/* Install PWA Button */}
          <InstallPwaButton onOpenGuide={onOpenInstallGuide} />

          {/* Share App Button */}
          <ShareButton />

          {/* User Profile & Avatar Pill */}
          {user?.email && (
            <div
              className="nav-user-pill"
              onClick={onOpenAvatarModal}
              title={`Signed in as ${user.email}. Click to change avatar.`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenAvatarModal?.()}
              aria-label={`User profile: ${user.email}`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User Avatar"
                  className="nav-user-avatar"
                />
              ) : (
                <div className="nav-user-initials">
                  {initials}
                </div>
              )}
              <span className="nav-user-email">
                {user.email}
              </span>
              <Camera size={13} className="nav-user-camera" />
            </div>
          )}

          {onSimulateCrash && (
            <button
              type="button"
              className="btn btn-secondary nav-crash-btn"
              onClick={onSimulateCrash}
              title="Test Error Boundary in Navigation"
            >
              💥 Crash
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
