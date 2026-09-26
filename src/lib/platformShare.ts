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
 * Universal Platform selector simulating React Native Platform API on web
 */
export const Platform = {
  OS: 'web' as const,
  select: <T>(specifics: { web?: T; default?: T }): T => {
    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'
    if (isWeb && specifics.web !== undefined) {
      return specifics.web
    }
    return specifics.default as T
  },
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
          if ((err as Error)?.name === 'AbortError') {
            return { success: false }
          }
        }
      }

      // Web clipboard fallback
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
      // Native path: zero web APIs called
      try {
        const globalScope = globalThis as unknown as {
          require?: (module: string) => { Share?: { share: (content: { title?: string; message: string; url?: string }) => Promise<unknown> } }
        }
        const RN = typeof globalScope.require === 'function' ? globalScope.require('react-native') : null
        if (RN && RN.Share) {
          const fullMessage = payload.url ? `${payload.text}\n${payload.url}` : payload.text
          await RN.Share.share({
            title: payload.title,
            message: fullMessage,
            url: payload.url,
          })
          return { success: true }
        }
      } catch (err) {
        return { success: false, error: err }
      }
      return { success: false }
    },
  })

  return await handler()
}
