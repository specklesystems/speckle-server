import type { Optional } from '@speckle/shared'
import type { ToastNotification } from '@speckle/ui-components'
import { useTimeoutFn } from '@vueuse/core'
import { ToastNotificationType } from '@speckle/ui-components'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { v4 as uuidv4 } from 'uuid'

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
  type Timeout = {
    id: string
    stop: () => void
  }

  const stateNotification = useGlobalToastState()

  const timeouts = ref<Timeout[]>([])
  const currentNotifications = ref<ToastNotification[]>(
    Array.isArray(stateNotification.value) ? stateNotification.value : []
  )
  const readOnlyNotification = computed(() => currentNotifications.value)

  // Remove a specific notification from the state
  const removeNotification = (id: string) => {
    const index = currentNotifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      currentNotifications.value.splice(index, 1)
    }
  }

  // Create a timeout for a notification
  const createTimeout = (notification: ToastNotification) => {
    const { stop } = useTimeoutFn(() => {
      if (notification.id) {
        removeNotification(notification.id)
      }
    }, 4000)
    return stop
  }

  watch(
    stateNotification,
    (newVal) => {
      if (!newVal) return
      currentNotifications.value = newVal

      if (import.meta.server) return

      // Create timeout for the new notification
      const index = currentNotifications.value.length - 1
      const lastNotification = newVal[index]

      if (lastNotification && !lastNotification.autoClose) {
        timeouts.value.push({
          id: lastNotification.id as string,
          stop: createTimeout(lastNotification)
        })
      }
    },
    { deep: true, immediate: true }
  )

  // Function to dismiss a specific notification
  const dismiss = (notification: ToastNotification) => {
    if (!notification.id) return

    const targetTimeout = timeouts.value.find((t) => t.id === notification.id)
    if (targetTimeout) {
      targetTimeout.stop()
      timeouts.value = timeouts.value.filter((t) => t.id !== notification.id)
    }
    removeNotification(notification.id as string)
  }

  // Dismiss all notifications
  const dismissAll = () => {
    timeouts.value.forEach((timeout) => timeout.stop())
    timeouts.value = []
    currentNotifications.value = []
  }

  return { currentNotifications: readOnlyNotification, dismiss, dismissAll }
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
    const newNotification = { ...notification, id: uuidv4() }

    stateNotification.value
      ? stateNotification.value.push(newNotification)
      : (stateNotification.value = [newNotification])

    if (import.meta.server) {
      logger.info('Queued SSR toast notification', notification)
    }
  }

  return { triggerNotification }
}

export { ToastNotificationType }
export type { ToastNotification }
