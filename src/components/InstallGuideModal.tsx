import React from 'react'
import { X, Laptop, Smartphone, Compass, Sparkles } from 'lucide-react'

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

interface InstallGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [platform] = React.useState<'mac-safari' | 'ios' | 'android' | 'desktop-chrome' | 'other'>(() => detectPlatform())

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
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
                flexShrink: 0,
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
            onClick={onClose}
            aria-label="Close installation guide"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 16px' }}>
          Install HABIT//PULSE as a standalone app on your device for full offline access:
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
                Or click the <strong>three dots (⋮)</strong> menu &rarr; <strong>Save and share</strong> &rarr; <strong>Install HABIT//PULSE</strong>.
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
              <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari.</li>
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
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallGuideModal
