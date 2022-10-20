import { useEventBus, useTimeoutFn } from '@vueuse/core'
import { Nullable } from '@speckle/shared'

const triggerNotificationEvent = 'speckle.globalToast.trigger'

export enum ToastNotificationType {
  Success,
  Warning,
  Danger,
  Info
}

export type ToastNotification = {
  title: string
  /**
   * Optionally provide extra text
   */
  description?: string
  type: ToastNotificationType
  /**
   * Optionally specify a CTA link on the right
   */
  cta?: {
    title: string
    url?: string
    onClick?: (e: MouseEvent) => void
  }
}

const useTriggerNotificationEventBus = () =>
  useEventBus<ToastNotification>(triggerNotificationEvent)

/**
 * Set up a new global toast manager/renderer (don't use this in multiple components that live at the same time)
 */
export function useGlobalToastManager() {
  const bus = useTriggerNotificationEventBus()

  const activeNotification = ref<Nullable<ToastNotification>>(null)
  const currentNotification = computed(() => activeNotification.value)

  const { start, stop } = useTimeoutFn(() => {
    dismiss()
  }, 4000)

  onMounted(() => {
    bus.on((e) => {
      // First dismiss old notification, then set a new one on next tick
      // this is so that the old one actually disappears from the screen for the user,
      // instead of just having its contents replaced
      dismiss()

      nextTick(() => {
        activeNotification.value = e

        // (re-)init timeout
        stop()
        start()
      })
    })
  })

  onUnmounted(() => {
    bus.reset()
  })

  const dismiss = () => {
    activeNotification.value = null
  }

  return { currentNotification, dismiss }
}

/**
 * Trigger global toast notifications
 */
export function useGlobalToast() {
  const bus = useTriggerNotificationEventBus()

  /**
   * Trigger a new toast notification
   */
  const triggerNotification = (notification: ToastNotification) => {
    bus.emit(notification)
  }

  return { triggerNotification }
}
