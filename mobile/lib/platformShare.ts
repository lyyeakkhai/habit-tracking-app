import { Platform, Share as NativeShare } from 'react-native'

export interface SharePayload {
  title: string
  text: string
  url?: string
}

export interface ShareResult {
  success: boolean
  copiedFallback?: boolean
  error?: unknown
}

/**
 * Platform branch via Platform.select — exactly ONE call site.
 * Web branch: uses navigator.share with clipboard fallback.
 * Native branch: uses native Share.share with zero web APIs leaking.
 */
export const shareHabit = async (payload: SharePayload): Promise<ShareResult> => {
  const handler = Platform.select({
    web: async (): Promise<ShareResult> => {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            url: payload.url,
          })
          return { success: true }
        } catch (err: unknown) {
          if ((err as Error)?.name === 'AbortError') return { success: false }
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          const shareText = payload.url ? `${payload.text} ${payload.url}`.trim() : payload.text
          await navigator.clipboard.writeText(shareText)
          return { success: true, copiedFallback: true }
        } catch (clipErr) {
          return { success: false, error: clipErr }
        }
      }

      return { success: false }
    },
    default: async (): Promise<ShareResult> => {
      // Native path (iOS & Android): zero web APIs called
      try {
        const fullMessage = payload.url ? `${payload.text}\n${payload.url}` : payload.text
        await NativeShare.share({
          title: payload.title,
          message: fullMessage,
          url: payload.url,
        })
        return { success: true }
      } catch (err) {
        return { success: false, error: err }
      }
    },
  })

  if (handler) {
    return await handler()
  }
  return { success: false }
}
