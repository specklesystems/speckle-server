import { useApolloClient } from '@vue/apollo-composable'
import { accSyncItemDeleteMutation } from '~/lib/acc/graphql/mutations'
import type { AccSyncItem } from '~/lib/acc/types'
import { getCacheKey } from '~/lib/common/helpers/graphql'

export const useDeleteAccSyncItem = () => {
  const apollo = useApolloClient()
  const { triggerNotification } = useGlobalToast()

  return async (projectId: string, accSyncItemId: string) => {
    const result = await apollo.client
      .mutate({
        mutation: accSyncItemDeleteMutation,
        variables: {
          input: {
            id: accSyncItemId,
            projectId
          }
        },
        update: (cache) => {
          cache.evict({
            id: getCacheKey('AccSyncItem', accSyncItemId)
          })
          cache.modify({
            id: getCacheKey('Project', accSyncItemId),
            fields: {
              accSyncItems: (existingRefs = [], { readField }) => {
                return existingRefs.filter(
                  (ref: AccSyncItem) => readField('id', ref) !== accSyncItemId
                )
              }
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'ACC sync deleted',
        description: `Your model is no longer linked with an ACC file.`
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
