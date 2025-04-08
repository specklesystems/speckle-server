import { useMutation } from '@vue/apollo-composable'
import { isArray } from 'lodash'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type {
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
    mutate: async (
      input: ServerInviteCreateInput | ServerInviteCreateInput[],
      options?: { hideToasts?: boolean }
    ) => {
      const finalInput = isArray(input) ? input : [input]
      const { hideToasts } = options || {}

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
        if (!hideToasts) {
          triggerNotification({
            type: ToastNotificationType.Success,
            title:
              finalInput.length > 1
                ? 'Server invites sent'
                : `Server invite sent to ${finalInput[0].email}`
          })
        }
      } else {
        const errMsg = getFirstErrorMessage(res?.errors)
        if (!hideToasts) {
          triggerNotification({
            type: ToastNotificationType.Danger,
            title:
              finalInput.length > 1
                ? "Couldn't send invites"
                : `Couldn't send invite to ${finalInput[0].email}`,
            description: errMsg
          })
        }
      }

      return !!res?.data?.serverInviteBatchCreate
    },
    loading
  }
}
