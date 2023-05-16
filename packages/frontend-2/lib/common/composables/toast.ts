import { useTimeoutFn } from '@vueuse/core'
import { Nullable } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'
import { Ref } from 'vue'
import type { ToastNotification } from '@speckle/ui-components'
import { ToastNotificationType } from '@speckle/ui-components'

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
      if (!newVal) return

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
    stateNotification.value = null
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

export { ToastNotification, ToastNotificationType }
