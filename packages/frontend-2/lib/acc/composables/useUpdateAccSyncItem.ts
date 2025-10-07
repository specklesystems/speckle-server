import { useApolloClient } from '@vue/apollo-composable'
import { accSyncItemUpdateMutation } from '~/lib/acc/graphql/mutations'
import type { AccSyncItemStatus } from '~/lib/acc/types'
import { getCacheKey } from '~/lib/common/helpers/graphql'

export const useUpdateAccSyncItem = () => {
  const apollo = useApolloClient()
  const { triggerNotification } = useGlobalToast()

  return async (
    projectId: string,
    accSyncItemId: string,
    status: AccSyncItemStatus
  ) => {
    const result = await apollo.client
      .mutate({
        mutation: accSyncItemUpdateMutation,
        variables: {
          input: {
            id: accSyncItemId,
            projectId,
            status
          }
        },
        update: (cache) => {
          cache.modify({
            id: getCacheKey('AccSyncItem', accSyncItemId),
            fields: {
              status: () => status
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'ACC sync updated',
        description: 'Successfully updated ACC sync'
      })
    } else {
      const errMsg = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: errMsg
      })
    }
  }
}
