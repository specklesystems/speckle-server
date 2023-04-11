import { useMutation } from '@vue/apollo-composable'
import { cloneDeep } from 'lodash-es'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { UserUpdateInput } from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import {
  updateNotificationPreferencesMutation,
  updateUserMutation
} from '~~/lib/user/graphql/mutations'
import { NotificationPreferences } from '~~/lib/user/helpers/components'

export function useUpdateUserProfile() {
  const { mutate, loading } = useMutation(updateUserMutation)
  const { triggerNotification } = useGlobalToast()

  return {
    mutate: async (input: UserUpdateInput) => {
      const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

      if (result?.data?.activeUserMutations.update.id) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Profile updated'
        })
      } else {
        const errMsg = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Profile update failed',
          description: errMsg
        })
      }

      return result
    },
    loading
  }
}

export function useUpdateNotificationPreferences() {
  const { mutate, loading } = useMutation(updateNotificationPreferencesMutation)
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  return {
    mutate: async (input: NotificationPreferences) => {
      const result = await mutate(
        { input },
        {
          update: (cache, res) => {
            if (!res.data?.userNotificationPreferencesUpdate || !activeUser.value)
              return

            // Update preferences in cache
            cache.modify({
              id: getCacheId('User', activeUser.value.id),
              fields: {
                notificationPreferences: () => cloneDeep(input)
              }
            })
          }
        }
      ).catch(convertThrowIntoFetchResult)

      if (result?.data?.userNotificationPreferencesUpdate) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Notification preferences updated'
        })
      } else {
        const errMsg = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Notification preferences update failed',
          description: errMsg
        })
      }

      return result
    },
    loading
  }
}
