import { ensureError } from '@speckle/shared'
import { useClipboard as coreUseClipboard, useBreakpoints } from '@vueuse/core'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
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

export const useIsSmallerOrEqualThanBreakpoint = () => {
  const breakpoints = useBreakpoints(TailwindBreakpoints)
  return {
    isSmallerOrEqualSm: computed(() => breakpoints.smallerOrEqual('sm').value),
    isSmallerOrEqualMd: computed(() => breakpoints.smallerOrEqual('md').value),
    isSmallerOrEqualLg: computed(() => breakpoints.smallerOrEqual('lg').value),
    isSmallerOrEqualXl: computed(() => breakpoints.smallerOrEqual('xl').value),
    isSmallerOrEqual2xl: computed(() => breakpoints.smallerOrEqual('2xl').value)
  }
}
