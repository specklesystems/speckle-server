import type { MaybeNullOrUndefined } from '@speckle/shared'

/**
 * Smart tooltip delay composable
 *
 * Provides sophisticated tooltip behavior where:
 * - First tooltip shows after a configurable delay (default 1 second)
 * - Subsequent tooltips show instantly once user has shown intent
 * - State resets after a period of inactivity (default 3 seconds)
 */

export function useSmartTooltipDelay() {
  const initialDelay = 350
  const resetAfter = 2000

  const hasShownAny = ref(false)
  const resetTimer = ref<NodeJS.Timeout | null>(null)

  const getTooltipProps = (
    content?: MaybeNullOrUndefined<
      string | { content: string; allowHTML?: boolean; theme?: string }
    >,
    additionalProps: Record<string, unknown> = {}
  ) => {
    // If content is already a tooltip configuration object, merge it with our base props
    if (typeof content === 'object' && content !== null) {
      return {
        ...content,
        delay: hasShownAny.value ? 0 : initialDelay,
        onShow: () => {
          hasShownAny.value = true
          if (resetTimer.value) {
            clearTimeout(resetTimer.value)
          }
          resetTimer.value = setTimeout(() => {
            hasShownAny.value = false
          }, resetAfter)
        },
        ...additionalProps
      }
    }

    // Handle string content
    return {
      content,
      delay: hasShownAny.value ? 0 : initialDelay,
      onShow: () => {
        hasShownAny.value = true
        if (resetTimer.value) {
          clearTimeout(resetTimer.value)
        }
        resetTimer.value = setTimeout(() => {
          hasShownAny.value = false
        }, resetAfter)
      },
      ...additionalProps
    }
  }

  const cleanup = () => {
    if (resetTimer.value) {
      clearTimeout(resetTimer.value)
      resetTimer.value = null
    }
  }

  const reset = () => {
    cleanup()
    hasShownAny.value = false
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    getTooltipProps,
    reset
  }
}
