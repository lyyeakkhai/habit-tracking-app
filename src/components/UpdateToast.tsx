import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Sparkles, RefreshCw, X } from './icons'

export const UpdateToast: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const closeToast = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        margin: '0 auto',
        maxWidth: '380px',
        width: 'calc(100% - 32px)',
        boxSizing: 'border-box',
        zIndex: 10000,
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 230, 118, 0.25)',
        border: '1px solid var(--neon-green)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'scaleUp 0.25s ease-out',
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 230, 118, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neon-green)',
          flexShrink: 0,
        }}
      >
        <Sparkles size={20} />
      </div>

      <div style={{ flex: 1 }}>
        <div role="heading" aria-level={2} style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {needRefresh ? 'New version available!' : 'App ready offline'}
        </div>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {needRefresh
            ? 'A new build of HABIT//PULSE is installed. Refresh to update.'
            : 'All assets cached. You can track habits with no internet connection.'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {needRefresh && (
          <button
            type="button"
            className="btn btn-neon"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => updateServiceWorker(true)}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          style={{ width: '28px', height: '28px' }}
          onClick={closeToast}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default UpdateToast
