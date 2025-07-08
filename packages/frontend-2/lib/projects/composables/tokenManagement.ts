import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { deleteEmbedTokenMutation } from '~~/lib/projects/graphql/mutations'
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
