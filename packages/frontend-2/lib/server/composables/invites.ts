import { useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ServerInviteCreateInput } from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { inviteServerUserMutation } from '../graphql/mutations'

export function useInviteUserToServer() {
  const { triggerNotification } = useGlobalToast()
  const { mutate, loading } = useMutation(inviteServerUserMutation)

  return {
    mutate: async (input: ServerInviteCreateInput) => {
      const res = await mutate({
        input
      }).catch(convertThrowIntoFetchResult)

      if (res?.data?.serverInviteCreate) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Server invite sent'
        })
      } else {
        const errMsg = getFirstErrorMessage(res?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: "Couldn't send invite",
          description: errMsg
        })
      }

      return !!res?.data?.serverInviteCreate
    },
    loading
  }
}
