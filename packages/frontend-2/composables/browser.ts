import { reactive, onMounted, onUnmounted } from 'vue'
import { ensureError } from '@speckle/shared'
import { useClipboard as coreUseClipboard } from '@vueuse/core'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

/**
 * A wrapper over vueuse's useClipboard that also triggers toast notifications
 */
export const useClipboard = () => {
  // non-legacy doesn't seem to work in dev environments
  const { copy } = coreUseClipboard({ legacy: true })
  const { triggerNotification } = useGlobalToast()

  return {
    copy: async (
      text: string,
      options?: Partial<{
        successMessage?: string
        failureMessage?: string
      }>
    ) => {
      const successMessage = options?.successMessage || 'Value copied to clipboard'
      const failureMessage =
        options?.failureMessage || 'Failed to copy value to clipboard'

      try {
        await copy(text)
        triggerNotification({
          type: ToastNotificationType.Info,
          title: successMessage
        })
      } catch (e) {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: failureMessage,
          description: ensureError(e).message
        })
      }
    }
  }
}

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const useBreakpoints = () => {
  const state = reactive({
    width: window.innerWidth,
    height: window.innerHeight
  })

  const onResize = () => {
    state.width = window.innerWidth
    state.height = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
  })

  const breakpoints: Record<Breakpoint, number> = {
    xs: 425,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }

  const isMediaQueryMax = (breakpoint: Breakpoint) => {
    const value = breakpoints[breakpoint]
    return state.width <= value
  }

  const isMediaQueryMin = (breakpoint: Breakpoint) => {
    const value = breakpoints[breakpoint]
    return state.width >= value
  }

  return {
    width: state.width,
    height: state.height,
    isMediaQueryMax,
    isMediaQueryMin
  }
}
