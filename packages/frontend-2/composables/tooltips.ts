import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

/**
 * Smart tooltip delay composable
 *
 * Provides sophisticated tooltip behavior where:
 * - First tooltip shows after a configurable delay (default 1 second)
 * - Subsequent tooltips show instantly once user has shown intent
 * - State resets after a period of inactivity (default 3 seconds)
 * - Only shows tooltips on non-mobile devices
 */

export function useSmartTooltipDelay() {
  const breakpoints = useBreakpoints(TailwindBreakpoints)
  const isMobile = breakpoints.smaller('sm')

  const initialDelay = 1000
  const resetAfter = 3000

  const hasShownAny = ref(false)
  const resetTimer = ref<NodeJS.Timeout | null>(null)

  const getTooltipProps = (
    content?: MaybeNullOrUndefined<string>,
    additionalProps: Record<string, unknown> = {}
  ) => {
    // Don't show tooltips on mobile devices
    if (isMobile.value) {
      return {
        content: null,
        disabled: true,
        ...additionalProps
      }
    }

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
