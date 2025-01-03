import { useTimeoutFn, createGlobalState } from '@vueuse/core'
import type { Nullable } from '@speckle/shared'
import { computed, nextTick, watch } from 'vue'
import { ref } from 'vue'
import type { ToastNotification } from '~~/src/helpers/global/toast'

/**
 * Development-only version of the toast notification state. Do not export this out from the library as it can't work in SSR!
 */

const useGlobalToastState = createGlobalState(() =>
  ref(null as Nullable<ToastNotification>)
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
    async (newVal) => {
      if (!newVal) return

      // First dismiss old notification, then set a new one on next tick
      // this is so that the old one actually disappears from the screen for the user,
      // instead of just having its contents replaced
      dismiss()

      await nextTick(() => {
        currentNotification.value = newVal

        // (re-)init timeout
        stop()
        if (newVal.autoClose !== false) start()
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
