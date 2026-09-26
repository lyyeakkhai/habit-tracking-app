import React, { useState, useEffect } from 'react'
import { Download } from './icons'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export const InstallPwaButton: React.FC<{
  style?: React.CSSProperties
  className?: string
  iconOnly?: boolean
  onOpenGuide?: () => void
}> = ({
  style,
  className = 'btn btn-secondary',
  iconOnly = false,
  onOpenGuide,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone
    )
  })

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    const handleMqlChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
      }
    }
    mql.addEventListener?.('change', handleMqlChange)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      mql.removeEventListener?.('change', handleMqlChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setIsInstalled(true)
        }
      } catch (err) {
        console.error('Install prompt error:', err)
      } finally {
        setDeferredPrompt(null)
      }
      return
    }

    // If native prompt is unavailable (e.g. Safari on Mac or iOS), trigger the page-level guide modal
    if (onOpenGuide) {
      onOpenGuide()
    }
  }

  if (isInstalled) {
    return null
  }

  return (
    <button
      type="button"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '0.82rem',
        padding: iconOnly ? '8px' : '6px 12px',
        minHeight: '44px',
        minWidth: iconOnly ? '44px' : undefined,
        borderColor: 'var(--neon-green)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        boxSizing: 'border-box',
        ...style,
      }}
      onClick={handleInstallClick}
      title="Install HABIT//PULSE on your device"
      aria-label="Install App"
    >
      <Download size={16} color="var(--neon-green)" />
      {!iconOnly && <span className="install-btn-text">Install App</span>}
    </button>
  )
}

export default InstallPwaButton
