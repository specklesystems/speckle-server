import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  settingsNewEmailVerificationMutation,
  settingsDeleteUserEmailMutation
} from '~/lib/settings/graphql/mutations'
import { settingsUserEmailsQuery } from '~/lib/settings/graphql/queries'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'

export function useUserEmails() {
  const { triggerNotification } = useGlobalToast()

  const { result } = useQuery(settingsUserEmailsQuery)
  const { mutate: resendMutation } = useMutation(settingsNewEmailVerificationMutation)
  const { mutate: deleteMutation } = useMutation(settingsDeleteUserEmailMutation)

  const emails = computed(() => result.value?.activeUser?.emails ?? [])

  const unverifiedEmail = computed(() => {
    const email =
      emails.value.find((e) => e.primary && !e.verified) ||
      emails.value.find((e) => !e.primary && !e.verified)
    return email || null
  })

  const resendVerificationEmail = async () => {
    if (!unverifiedEmail.value?.id) return null

    const result = await resendMutation({
      input: { id: unverifiedEmail.value.id }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Verification email sent to ${unverifiedEmail.value.email}`
      })
      return true
    }

    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error sending verification email',
      description: errorMessage
    })
    return false
  }

  const deleteUserEmail = async (emailId: string, email: string, cancel = false) => {
    const result = await deleteMutation({
      input: { id: emailId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `${cancel ? 'Cancelled adding email' : 'Deleted email'}`,
        description: `${email}`
      })
      return true
    }

    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error deleting email',
      description: errorMessage
    })
    return false
  }

  return {
    emails,
    unverifiedEmail,
    resendVerificationEmail,
    deleteUserEmail
  }
}
