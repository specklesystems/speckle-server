import { useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { UserUpdateInput } from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { updateUserMutation } from '~~/lib/user/graphql/mutations'

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
