import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import {
  requestResetEmail,
  finalizePasswordReset
} from '~~/lib/auth/services/resetPassword'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

export function usePasswordReset() {
  const apiOrigin = useApiOrigin()
  const { triggerNotification } = useGlobalToast()
  const { logout } = useAuthManager()

  const loading = ref(false)

  const sendResetEmail = async (email: string) => {
    try {
      loading.value = true
      await requestResetEmail({ email, apiOrigin })
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Password reset process initialized',
        description: `We've sent you instructions on how to reset your password at ${email}`
      })
    } catch (e) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Password reset failed',
        description: `${ensureError(e).message}`
      })
    } finally {
      loading.value = false
    }
  }

  const finalize = async (password: string, token: string) => {
    try {
      loading.value = true
      await finalizePasswordReset({ password, token, apiOrigin })
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Password successfully changed',
        description: `You can now log in with your new password`
      })
      await logout({ skipToast: true })
    } catch (e) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Password change failed',
        description: `${ensureError(e).message}`
      })
    } finally {
      loading.value = false
    }
  }

  return { sendResetEmail, finalize }
}
