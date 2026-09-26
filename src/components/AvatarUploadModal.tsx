import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, AlertCircle, Check, Camera, Image as ImageIcon } from './icons'
import { validateAvatarFile } from '../hooks/useProfile'

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatarUrl: string | null
  userEmail: string | null
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  userEmail,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URLs when preview changes or modal closes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(null)
      setPreviewUrl(null)
      setValidationError(null)
      setSuccessMessage(null)
      setIsUploading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setValidationError(null)
    setSuccessMessage(null)

    if (!file) return

    // 1. Hand-written validation logic (type and size <= 1MB)
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file.')
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // 2. Generate local preview using URL.createObjectURL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setValidationError('Please select an image file first.')
      return
    }

    try {
      setIsUploading(true)
      setValidationError(null)
      const res = await onUpload(selectedFile)

      if (res.success) {
        setSuccessMessage('Avatar uploaded and profile updated successfully!')
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setValidationError(res.error || 'Failed to upload avatar.')
      }
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const displayAvatar = previewUrl || currentAvatarUrl
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'HP'

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
      <div
        className="modal-content"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--neon-green)" />
            <h2 id="avatar-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Profile Avatar</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isUploading}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Avatar Preview Display */}
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              border: '3px solid var(--neon-green)',
              boxShadow: '0 0 20px rgba(0, 230, 118, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar Preview"
                loading="lazy"
                decoding="async"
                width={160}
                height={160}
                style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '2rem',
                  color: 'var(--neon-green)',
                  backgroundColor: 'rgba(0, 230, 118, 0.1)',
                }}
              >
                {initials}
              </div>
            )}

            {previewUrl && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  textAlign: 'center',
                  padding: '2px 0',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Preview
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              {previewUrl ? 'Ready to Upload' : currentAvatarUrl ? 'Change Your Avatar' : 'Add Profile Photo'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, WEBP, GIF up to 1 MB
            </p>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="alert alert-danger" style={{ width: '100%', margin: 0 }} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem' }}>{validationError}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="alert alert-success" style={{ width: '100%', margin: 0 }} role="status">
              <Check size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem' }}>{successMessage}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="avatar-file-input"
            aria-label="Upload Avatar File"
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon size={16} />
              {previewUrl ? 'Choose Different File' : 'Browse File...'}
            </button>

            {previewUrl && (
              <button
                type="button"
                className="btn btn-neon"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleUploadSubmit}
                disabled={isUploading}
              >
                <Upload size={16} className={isUploading ? 'neon-spinner' : ''} />
                {isUploading ? 'Uploading...' : 'Save Avatar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarUploadModal
