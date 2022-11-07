import { useTimeoutFn } from '@vueuse/core'
import { Nullable } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'
import { Ref } from 'vue'

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

const useGlobalToastState = () =>
  useScopedState<Ref<Nullable<ToastNotification>>>('global-toast-state', () =>
    ref(null)
  )

/**
 * Set up a new global toast manager/renderer (don't use this in multiple components that live at the same time)
 */
export function useGlobalToastManager() {
  const stateNotification = useGlobalToastState()

  const currentNotification = ref(stateNotification.value)
  const readOnlyNotification = computed(() => currentNotification.value)

  const { start, stop } = useTimeoutFn(() => {
    dismiss()
  }, 4000)

  watch(
    stateNotification,
    (newVal) => {
      // First dismiss old notification, then set a new one on next tick
      // this is so that the old one actually disappears from the screen for the user,
      // instead of just having its contents replaced
      dismiss()

      nextTick(() => {
        currentNotification.value = newVal

        // (re-)init timeout
        stop()
        start()
      })
    },
    { deep: true }
  )

  const dismiss = () => {
    currentNotification.value = null
  }

  return { currentNotification: readOnlyNotification, dismiss }
}

/**
 * Trigger global toast notifications
 */
export function useGlobalToast() {
  const stateNotification = useGlobalToastState()

  /**
   * Trigger a new toast notification
   */
  const triggerNotification = (notification: ToastNotification) => {
    stateNotification.value = notification
  }

  return { triggerNotification }
}
