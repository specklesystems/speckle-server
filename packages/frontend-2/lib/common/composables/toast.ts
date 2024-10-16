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
  useSynchronizedCookie<Optional<ToastNotification[]>>('global-toast-state')

/**
 * Set up a new global toast manager/renderer (don't use this in multiple components that live at the same time)
 */
export function useGlobalToastManager() {
  const stateNotification = useGlobalToastState()

  const currentNotification = ref<ToastNotification[]>(
    Array.isArray(stateNotification.value) ? stateNotification.value : []
  )
  const readOnlyNotification = computed(() => currentNotification.value)

  const dismissNotification = (index: number) => {
    currentNotification.value.splice(index, 1)
    if (currentNotification.value.length === 0) {
      stateNotification.value = undefined
    } else {
      stateNotification.value = currentNotification.value
    }
  }

  const createTimeout = (index: number) => {
    const { stop } = useTimeoutFn(() => {
      dismissNotification(index)
    }, 4000)
    return stop
  }

  const timeouts = ref<(() => void)[]>([])

  watch(
    stateNotification,
    (newVal) => {
      if (!newVal) return
      if (import.meta.server) {
        currentNotification.value = newVal
        return
      }

      // Add new notification
      currentNotification.value = newVal

      // Create timeout for the new notification
      const index = currentNotification.value.length - 1
      const lastNotification = newVal[index]
      if (lastNotification && lastNotification.autoClose !== false) {
        const stopTimeout = createTimeout(index)
        timeouts.value.push(stopTimeout)
      }
    },
    { deep: true, immediate: true }
  )

  // Function to dismiss a specific notification
  const dismiss = (index: number) => {
    if (timeouts.value[index]) {
      timeouts.value[index]() // Stop the timeout
    }
    dismissNotification(index)
    timeouts.value.splice(index, 1) // Remove the timeout from the array
  }

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
    stateNotification.value
      ? stateNotification.value.push(notification)
      : (stateNotification.value = [notification])

    if (import.meta.server) {
      logger.info('Queued SSR toast notification', notification)
    }
  }

  return { triggerNotification }
}

export { ToastNotificationType }
export type { ToastNotification }
