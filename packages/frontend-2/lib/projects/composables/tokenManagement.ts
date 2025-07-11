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
import { useMutation } from '@vue/apollo-composable'

export const useDeleteEmbedToken = () => {
  const { triggerNotification } = useGlobalToast()
  const { mutate } = useMutation(deleteEmbedTokenMutation)

  return async (input: { projectId: string; token: string }) => {
    const { projectId, token } = input

    const result = await mutate(
      {
        projectId,
        token
      },
      {
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
      }
    ).catch(convertThrowIntoFetchResult)

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
  const { mutate } = useMutation(deleteAllProjectEmbedTokensMutation)

  return async (input: { projectId: string }) => {
    const { projectId } = input

    await mutate(
      { projectId },
      {
        update(cache, { data }) {
          if (!data?.projectMutations.revokeEmbedTokens) return

          cache.evict({
            id: getCacheId('Project', projectId),
            fieldName: 'embedTokens'
          })
        }
      }
    ).catch(convertThrowIntoFetchResult)
  }
}

export const useCreateEmbedToken = () => {
  const { mutate } = useMutation(createEmbedTokenMutation)

  return async (input: { projectId: string; resourceIdString: string }) => {
    const { projectId, resourceIdString } = input

    const result = await mutate(
      {
        token: { projectId, resourceIdString }
      },
      {
        update: (cache, { data }) => {
          const createResult = data?.projectMutations.createEmbedToken
          if (!createResult?.token || !createResult?.tokenMetadata) return

          const tokenMetadata = createResult.tokenMetadata

          modifyObjectField(
            cache,
            getCacheId('Project', projectId),
            'embedTokens',
            ({ helpers: { createUpdatedValue } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => [
                  {
                    ...tokenMetadata,
                    user: tokenMetadata.user
                      ? {
                          __ref: getCacheId('LimitedUser', tokenMetadata.user.id)
                        }
                      : null
                  },
                  ...items
                ])
              })
            },
            {
              autoEvictFiltered: true
            }
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    return result?.data?.projectMutations.createEmbedToken.token
  }
}
