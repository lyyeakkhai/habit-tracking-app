import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext'

export const MAX_AVATAR_SIZE_BYTES = 1 * 1024 * 1024 // 1 MB limit (1,048,576 bytes)
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Hand-written client-side validator for avatar file uploads.
 * Rejects non-image types and files > 1 MB with polite, actionable error messages.
 */
export function validateAvatarFile(file: File | null | undefined): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file was selected.' }
  }

  // 1. Validate file type (must be image)
  const isImage = file.type.startsWith('image/') && ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())
  if (!isImage) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload an image (PNG, JPG, WEBP, or GIF).`,
    }
  }

  // 2. Validate file size (<= 1 MB)
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the 1 MB limit. Please select a smaller photo.`,
    }
  }

  return { valid: true }
}

export function useProfile() {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch avatar on mount and whenever user changes
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setAvatarUrl(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Profile fetch note:', fetchError.message)
      }

      if (data?.avatar_url) {
        // Append timestamp cache-buster to ensure updated avatars reload immediately
        setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`)
      } else {
        setAvatarUrl(null)
      }
    } catch (err: unknown) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  /**
   * Upload an avatar file:
   * 1. Validates input client-side.
   * 2. Uploads to avatars/{user.id}/avatar.{ext} with upsert: true (replaces existing avatar, avoiding duplicate files).
   * 3. Retrieves public URL.
   * 4. Upserts public URL into profiles table.
   */
  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string; url?: string }> => {
    if (!user) {
      return { success: false, error: 'User must be authenticated to upload an avatar.' }
    }

    // Step 1: Hand-written client-side validation
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    try {
      setUploading(true)
      setError(null)

      // Step 2: Upload into user's folder with fixed filename to replace previous avatar
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Step 3: Get public URL from avatars bucket
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Step 4: Save URL to profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        throw new Error(profileError.message)
      }

      const refreshedUrl = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(refreshedUrl)
      return { success: true, url: refreshedUrl }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while uploading avatar.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setUploading(false)
    }
  }

  return {
    avatarUrl,
    loading,
    uploading,
    error,
    fetchProfile,
    uploadAvatar,
    validateAvatarFile,
  }
}
