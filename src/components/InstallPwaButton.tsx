import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, Laptop, Smartphone, Compass, Sparkles } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function detectPlatform(): 'mac-safari' | 'ios' | 'android' | 'desktop-chrome' | 'other' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'other'

  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'

  const isAndroid = /Android/.test(ua)
  if (isAndroid) return 'android'

  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua)
  if (isMac && isSafari) return 'mac-safari'

  return 'desktop-chrome'
}

export const InstallPwaButton: React.FC<{
  style?: React.CSSProperties
  className?: string
  iconOnly?: boolean
}> = ({
  style,
  className = 'btn btn-secondary',
  iconOnly = false,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [platform] = useState<'mac-safari' | 'ios' | 'android' | 'desktop-chrome' | 'other'>(() => detectPlatform())

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
      setShowGuideModal(false)
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

    // If native prompt is unavailable (e.g. Safari on Mac or iOS), show the tailored install guide modal
    setShowGuideModal(true)
  }

  if (isInstalled) {
    return null
  }

  return (
    <>
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

      {/* Cyber-Zen Installation Guide Modal */}
      {showGuideModal && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            boxSizing: 'border-box',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Install HABIT//PULSE
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close installation guide"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 16px' }}>
              Install HABIT//PULSE as a standalone app on your desktop or mobile device for full offline access:
            </p>

            {platform === 'mac-safari' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#047857', fontWeight: 700 }}>
                  <Compass size={18} />
                  <span>Safari on macOS</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                  <li>Click <strong>File</strong> in the top macOS menu bar.</li>
                  <li>Select <strong>Add to Dock...</strong></li>
                  <li>Click <strong>Add</strong> to launch HABIT//PULSE like a native Mac app!</li>
                </ol>
              </div>
            )}

            {platform === 'desktop-chrome' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#047857', fontWeight: 700 }}>
                  <Laptop size={18} />
                  <span>Chrome / Edge Desktop</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                  <li>
                    Look at the right side of your <strong>URL address bar</strong> for the <strong>Install</strong> icon (⊕ or computer with arrow).
                  </li>
                  <li>
                    Or click the <strong>three dots (⋮)</strong> menu $\rightarrow$ <strong>Save and share</strong> $\rightarrow$ <strong>Install HABIT//PULSE</strong>.
                  </li>
                </ol>
              </div>
            )}

            {platform === 'ios' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#047857', fontWeight: 700 }}>
                  <Smartphone size={18} />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                  <li>Tap the <strong>Share</strong> button (box with arrow pointing up) at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>
            )}

            {platform === 'android' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#047857', fontWeight: 700 }}>
                  <Smartphone size={18} />
                  <span>Android (Chrome)</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                  <li>Tap the <strong>three dots (⋮)</strong> in the top right.</li>
                  <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-neon"
                onClick={() => setShowGuideModal(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default InstallPwaButton
