import React, { useState, useRef, useEffect } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  title?: string
  text?: string
  url?: string
  className?: string
  style?: React.CSSProperties
  iconOnly?: boolean
  label?: string
  ariaLabel?: string
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'HABIT//PULSE — Cyber-Zen Habit Tracker',
  text = 'Building unbreakable habits with HABIT//PULSE! Track your daily streaks with offline support.',
  url = typeof window !== 'undefined' ? window.location.origin : '',
  className = 'btn btn-secondary',
  style,
  iconOnly = false,
  label = 'Share',
  ariaLabel,
}) => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
        return
      } catch (err: unknown) {
        // If user cancelled, do nothing. If error, fall back to clipboard
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Clipboard fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const textToCopy = text ? `${text} ${url}`.trim() : url
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setCopied(false)
          timeoutRef.current = null
        }, 2500)
      }
    } catch (clipboardErr) {
      console.error('Clipboard copy failed:', clipboardErr)
    }
  }

  const effectiveAriaLabel = ariaLabel || (copied ? 'Link copied to clipboard' : 'Share')

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
        cursor: 'pointer',
        boxSizing: 'border-box',
        ...style,
      }}
      onClick={handleShare}
      title={copied ? 'Copied to clipboard!' : (title || 'Share')}
      aria-label={effectiveAriaLabel}
    >
      {copied ? (
        <>
          <Check size={16} color="var(--neon-green)" />
          {!iconOnly && <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>Copied!</span>}
        </>
      ) : (
        <>
          <Share2 size={16} />
          {!iconOnly && <span className="share-btn-text">{label}</span>}
        </>
      )}
    </button>
  )
}

export default ShareButton
