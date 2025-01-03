import { useTimeoutFn } from '@vueuse/core'
import type { Optional } from '@speckle/shared'
import type { ToastNotification } from '@speckle/ui-components'
import { ToastNotificationType } from '@speckle/ui-components'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'

/**
 * Persisting toast state between reqs and between CSR & SSR loads so that we can trigger
 * toasts anywhere and anytime
 */
const useGlobalToastState = () =>
  useSynchronizedCookie<Optional<ToastNotification>>('global-toast-state')

/**
 * Set up a new global toast manager/renderer (don't use this in multiple components that live at the same time)
 */
export function useGlobalToastManager() {
  const stateNotification = useGlobalToastState()

  const currentNotification = ref(stateNotification.value)
  const readOnlyNotification = computed(() => currentNotification.value)

  const dismiss = () => {
    currentNotification.value = undefined
    stateNotification.value = undefined
  }

  const { start, stop } = useTimeoutFn(() => {
    dismiss()
  }, 4000)

  watch(
    stateNotification,
    (newVal) => {
      if (!newVal) return
      if (import.meta.server) {
        currentNotification.value = newVal
        return
      }

      // First dismiss old notification, then set a new one on next tick
      // this is so that the old one actually disappears from the screen for the user,
      // instead of just having its contents replaced
      dismiss()

      nextTick(() => {
        currentNotification.value = newVal

        // (re-)init timeout
        stop()
        if (newVal.autoClose !== false) start()
      })
    },
    { deep: true, immediate: true }
  )

  return { currentNotification: readOnlyNotification, dismiss }
}

/**
 * Trigger global toast notifications
 */
export function useGlobalToast() {
  const stateNotification = useGlobalToastState()
  const logger = useLogger()

  /**
   * Trigger a new toast notification
   */
  const triggerNotification = (notification: ToastNotification) => {
    stateNotification.value = notification

    if (import.meta.server) {
      logger.info('Queued SSR toast notification', notification)
    }
  }

  return { triggerNotification }
}

export { ToastNotificationType }
export type { ToastNotification }
