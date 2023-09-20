import { useMutation } from '@vue/apollo-composable'
import { isArray } from 'lodash'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  AdminInviteList,
  ServerInviteCreateInput
} from '~~/lib/common/generated/gql/graphql'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { inviteServerUserMutation } from '../graphql/mutations'

export function useInviteUserToServer() {
  const { triggerNotification } = useGlobalToast()
  const { mutate, loading } = useMutation(inviteServerUserMutation)

  return {
    mutate: async (input: ServerInviteCreateInput | ServerInviteCreateInput[]) => {
      const finalInput = isArray(input) ? input : [input]
      const res = await mutate(
        {
          input: finalInput
        },
        {
          update: (cache, { data }) => {
            if (data?.serverInviteBatchCreate) {
              modifyObjectFields<undefined, { [key: string]: AdminInviteList }>(
                cache,
                ROOT_QUERY,
                (fieldName, _variables, value, details) => {
                  const inviteListFields = Object.keys(value).filter(
                    (k) =>
                      details.revolveFieldNameAndVariables(k).fieldName === 'inviteList'
                  )
                  const newVal: typeof value = { ...value }
                  for (const field of inviteListFields) {
                    delete newVal[field]
                  }
                  return newVal
                },
                { fieldNameWhitelist: ['admin'] }
              )
            }
          }
        }
      ).catch(convertThrowIntoFetchResult)

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
