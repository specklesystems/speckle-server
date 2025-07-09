import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  modifyObjectField,
  getCacheId
} from '~~/lib/common/helpers/graphql'
import {
  deleteEmbedTokenMutation,
  createEmbedTokenMutation,
  deleteAllProjectEmbedTokensMutation
} from '~~/lib/projects/graphql/mutations'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useApolloClient } from '@vue/apollo-composable'

export const useDeleteEmbedToken = () => {
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client

  return async (input: { projectId: string; token: string }) => {
    const { projectId, token } = input

    const result = await apollo
      .mutate({
        mutation: deleteEmbedTokenMutation,
        variables: {
          projectId,
          token
        },
        update: (cache, { data }) => {
          if (!data?.projectMutations.revokeEmbedToken) return

          modifyObjectField(
            cache,
            getCacheId('Project', projectId),
            'embedTokens',
            ({ helpers: { createUpdatedValue } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => Math.max(totalCount - 1, 0))
                update('items', (items) =>
                  items.filter((item) => item.tokenId !== token)
                )
              })
            },
            {
              autoEvictFiltered: true
            }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.revokeEmbedToken) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Token deleted'
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to delete token',
        description: getFirstErrorMessage(result?.errors)
      })
    }
  }
}

export const useDeleteAllEmbedTokens = () => {
  const apollo = useApolloClient().client

  return async (input: { projectId: string }) => {
    const { projectId } = input

    await apollo
      .mutate({
        mutation: deleteAllProjectEmbedTokensMutation,
        variables: { projectId },
        update(cache, { data }) {
          if (!data?.projectMutations.revokeEmbedTokens) return

          cache.evict({
            id: getCacheId('Project', projectId),
            fieldName: 'embedTokens'
          })
        }
      })
      .catch(convertThrowIntoFetchResult)
  }
}

export const useCreateEmbedToken = () => {
  const apollo = useApolloClient().client

  return async (input: { projectId: string; resourceIdString: string }) => {
    const { projectId, resourceIdString } = input

    const result = await apollo
      .mutate({
        mutation: createEmbedTokenMutation,
        variables: { token: { projectId, resourceIdString } }
      })
      .catch(convertThrowIntoFetchResult)

    return result.data?.projectMutations.createEmbedToken.token
  }
}
