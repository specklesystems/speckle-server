import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import {
  settingsNewEmailVerificationMutation,
  settingsDeleteUserEmailMutation,
  settingsCreateUserEmailMutation
} from '~/lib/settings/graphql/mutations'
import { userEmailsQuery } from '~/lib/user/graphql/queries'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId,
  modifyObjectField
} from '~/lib/common/helpers/graphql'
import type { UserEmail } from '~/lib/common/generated/gql/graphql'
import { useGlobalToast } from '~/lib/common/composables/toast'
import { useMixpanel } from '~/lib/core/composables/mp'
import {
  verifyEmailRoute,
  homeRoute,
  settingsUserRoutes
} from '~/lib/common/helpers/route'
import { verifyEmailMutation } from '~/lib/user/graphql/mutations'

export function useUserEmails() {
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const { result } = useQuery(userEmailsQuery)
  const route = useRoute()
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()

  const { mutate: resendMutation } = useMutation(settingsNewEmailVerificationMutation)
  const { mutate: deleteMutation } = useMutation(settingsDeleteUserEmailMutation)
  const { mutate: createMutation } = useMutation(settingsCreateUserEmailMutation)
  const { mutate: verifyMutation } = useMutation(verifyEmailMutation)

  // Simple array of all emails
  const emails = computed(() => result.value?.activeUser?.emails ?? ([] as UserEmail[]))

  // Helper computed properties for common queries
  const unverifiedPrimaryEmail = computed(
    () => emails.value.find((e) => e.primary && !e.verified) || null
  )

  const unverifiedEmails = computed(() => emails.value.filter((e) => !e.verified))

  const addUserEmail = async (email: string) => {
    const result = await createMutation({
      input: { email }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Email Added')
      navigateTo(verifyEmailRoute)
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

  const resendVerificationEmail = async (email: UserEmail) => {
    const result = await resendMutation({
      input: { id: email.id }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Verification email sent to ${email.email}`
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

  const deleteUserEmail = async (options: {
    email: UserEmail
    hideToast?: boolean
  }) => {
    const { email, hideToast } = options
    const result = await deleteMutation({
      input: { id: email.id }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      if (!hideToast) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Deleted email',
          description: email.email
        })
      }
      mixpanel.track('Email Deleted')

      // If we're on the verify email page and there are no more unverified emails, redirect home
      if (route.path === verifyEmailRoute && unverifiedEmails.value.length === 0) {
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

  const verifyUserEmail = async (email: UserEmail, code: string) => {
    mixpanel.track('Email Verification Started', {
      email: email.email,
      isPrimary: email.primary
    })

    const result = await verifyMutation({
      input: { email: email.email, code }
    }).catch(convertThrowIntoFetchResult)

    const activeUserId = computed(() => activeUser.value?.id)

    if (result?.data?.activeUserMutations?.emailMutations?.verify) {
      if (!activeUserId.value) return

      mixpanel.track('Email Verified', {
        email: email.email,
        isPrimary: email.primary
      })

      // Update UserEmail verified status in cache
      modifyObjectField(
        apollo.cache,
        getCacheId('UserEmail', email.id),
        'verified',
        () => true
      )

      // Only update User verified status if this is the primary email
      if (email.primary) {
        modifyObjectField(
          apollo.cache,
          getCacheId('User', activeUserId.value),
          'verified',
          () => true
        )
        navigateTo(homeRoute)
      } else {
        navigateTo(settingsUserRoutes.emails)
      }

      modifyObjectField(
        apollo.cache,
        getCacheId('User', activeUserId.value),
        'discoverableWorkspaces',
        ({ helpers: { evict } }) => evict()
      )

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Email verified',
        description: 'Your email has been successfully verified'
      })
      return true
    }

    mixpanel.track('Email Verification Failed', {
      email: email.email,
      isPrimary: email.primary
    })

    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Verification failed',
      description: 'The verification code you entered is incorrect or expired'
    })
    return false
  }

  return {
    emails,
    unverifiedPrimaryEmail,
    unverifiedEmails,
    addUserEmail,
    resendVerificationEmail,
    deleteUserEmail,
    verifyUserEmail
  }
}
