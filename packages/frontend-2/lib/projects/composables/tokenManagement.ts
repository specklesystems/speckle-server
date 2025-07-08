import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import {
  deleteEmbedTokenMutation,
  createEmbedTokenMutation
} from '~~/lib/projects/graphql/mutations'
import { useGlobalToast } from '~~/lib/common/composables/toast'
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
