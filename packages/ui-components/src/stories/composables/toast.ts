import { useTimeoutFn, createGlobalState } from '@vueuse/core'
import type { Optional } from '@speckle/shared'
import { computed, watch } from 'vue'
import { ref } from 'vue'
import type { ToastNotification } from '~~/src/helpers/global/toast'

/**
 * Development-only version of the toast notification state. Do not export this out from the library as it can't work in SSR!
 */

const useGlobalToastState = createGlobalState(() =>
  ref(undefined as Optional<ToastNotification[]>)
)

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

  /**
   * Trigger a new toast notification
   */
  const triggerNotification = (notification: ToastNotification) => {
    stateNotification.value
      ? stateNotification.value.push(notification)
      : (stateNotification.value = [notification])
  }

  return { triggerNotification }
}
