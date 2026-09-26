import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UpdateToast } from './components/UpdateToast'
import './App.css'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })))
const TrackerPage = lazy(() => import('./pages/TrackerPage').then(m => ({ default: m.TrackerPage })))

const RouteLoadingFallback: React.FC = () => (
  <div className="route-loading-fallback" role="status" aria-live="polite" aria-label="Loading page">
    <div className="route-loading-spinner" />
    <span className="route-loading-text">INITIALIZING SYSTEM...</span>
  </div>
)

export const App: React.FC = () => {
  return (
    <>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TrackerPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <UpdateToast />
    </>
  )
}

export default App
