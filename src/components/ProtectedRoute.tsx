import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-label="Authenticating session">
        <div className="neon-spinner"></div>
        <p className="loading-text">Verifying session...</p>
      </div>
    )
  }

  if (!user) {
    // Redirect unauthenticated visitors to /login, preserving attempt in state
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
