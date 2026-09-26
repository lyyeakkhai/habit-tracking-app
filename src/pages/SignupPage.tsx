import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, AlertCircle, CheckCircle, ArrowRight, Lock, Mail } from 'lucide-react'

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessNotice(null)

    if (!email.trim() || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const { error: signUpError, user: newUser, session: newSession } = await signUp(email.trim(), password)
      if (signUpError) {
        setError(signUpError.message)
      } else if (newUser && newUser.identities && newUser.identities.length === 0) {
        setError('An account with this email already exists.')
      } else if (!newSession) {
        // Email confirmation is required by Supabase project settings
        setSuccessNotice(
          'Account created! Please check your email inbox to confirm your address before signing in. (Tip: You can also disable "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email for instant local dev).'
        )
      } else {
        setSuccessNotice('Account created successfully! Redirecting to your habit dashboard...')
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 1200)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during sign up.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <Zap className="nav-brand-pulse" size={26} />
            <span>HABIT//PULSE</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join today to start building unbreakable daily habits</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="alert alert-success" role="status">
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password (min. 6 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-neon"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              'Creating account...'
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
