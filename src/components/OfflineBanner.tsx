import React from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

interface OfflineBannerProps {
  isOnline: boolean
  isSyncing: boolean
  syncSuccessNotice: string | null
  queuedCount: number
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isSyncing,
  syncSuccessNotice,
  queuedCount,
}) => {
  if (isOnline && !isSyncing && !syncSuccessNotice) {
    return null
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: !isOnline
          ? 'rgba(245, 158, 11, 0.95)'
          : isSyncing
          ? 'rgba(59, 130, 246, 0.95)'
          : 'rgba(16, 185, 129, 0.95)',
        color: '#ffffff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontSize: '0.85rem',
        fontWeight: 600,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        transition: 'all 0.3s ease-in-out',
      }}
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>
            Offline Mode: Working without signal.
            {queuedCount > 0
              ? ` (${queuedCount} habit${queuedCount > 1 ? 's' : ''} queued locally)`
              : ' Habits added will automatically sync on reconnect.'}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={16} className="neon-spinner" />
          <span>Connection restored! Syncing offline habits with Supabase...</span>
        </>
      ) : (
        <>
          <CheckCircle size={16} />
          <span>{syncSuccessNotice}</span>
        </>
      )}
    </div>
  )
}

export default OfflineBanner
