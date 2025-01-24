import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  settingsNewEmailVerificationMutation,
  settingsDeleteUserEmailMutation,
  settingsCreateUserEmailMutation
} from '~/lib/settings/graphql/mutations'
import { userEmailsQuery } from '~/lib/user/graphql/queries'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import { orderBy } from 'lodash-es'
import type { UserEmail } from '~/lib/common/generated/gql/graphql'
import { useGlobalToast } from '~/lib/common/composables/toast'
import { useMixpanel } from '~/lib/core/composables/mp'
import { verifyEmailRoute, homeRoute } from '~/lib/common/helpers/route'

export function useUserEmails() {
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const { result } = useQuery(userEmailsQuery)

  const { mutate: resendMutation } = useMutation(settingsNewEmailVerificationMutation)
  const { mutate: deleteMutation } = useMutation(settingsDeleteUserEmailMutation)
  const { mutate: createMutation } = useMutation(settingsCreateUserEmailMutation)

  const isEmailVerificationForced = useIsEmailVerificationForced()

  const emails = computed(() => {
    const emailList = result.value?.activeUser?.emails ?? []
    return orderBy(emailList, ['primary', 'verified'], ['desc', 'desc']) as UserEmail[]
  })

  const unverifiedEmail = computed(() => {
    const email =
      emails.value.find((e) => e.primary && !e.verified) ||
      emails.value.find((e) => !e.primary && !e.verified)
    return email || null
  })

  const addUserEmail = async (email: string) => {
    const result = await createMutation({
      input: { email }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Email Added')
      if (isEmailVerificationForced.value) {
        navigateTo(verifyEmailRoute)
      }
      return true
    }

    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error adding email',
      description: errorMessage
    })
    return false
  }

  const resendVerificationEmail = async (emailId: string, email: string) => {
    const result = await resendMutation({
      input: { id: emailId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Verification email sent to ${email}`
      })
      navigateTo(verifyEmailRoute)
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
    const route = useRoute()

    const result = await deleteMutation({
      input: { id: emailId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `${cancel ? 'Cancelled adding email' : 'Deleted email'}`,
        description: `${email}`
      })

      // If we're on the verify email page and there are no more unverified emails, redirect home
      if (route.path === verifyEmailRoute && !unverifiedEmail.value) {
        navigateTo(homeRoute)
      }

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
    addUserEmail,
    resendVerificationEmail,
    deleteUserEmail
  }
}
