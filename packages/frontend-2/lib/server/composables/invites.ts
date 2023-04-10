import { useMutation } from '@vue/apollo-composable'
import { isArray } from 'lodash'
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
    mutate: async (input: ServerInviteCreateInput | ServerInviteCreateInput[]) => {
      const finalInput = isArray(input) ? input : [input]
      const res = await mutate({
        input: finalInput
      }).catch(convertThrowIntoFetchResult)

      if (res?.data?.serverInviteBatchCreate) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: `Server invite${finalInput.length > 1 ? 's' : ''} sent`
        })
      } else {
        const errMsg = getFirstErrorMessage(res?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: `Couldn't send invite${finalInput.length > 1 ? 's' : ''}`,
          description: errMsg
        })
      }

      return !!res?.data?.serverInviteBatchCreate
    },
    loading
  }
}
