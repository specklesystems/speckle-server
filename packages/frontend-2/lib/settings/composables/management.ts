import { settingsUpdateWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { WorkspaceUpdateInput } from '~~/lib/common/generated/gql/graphql'

export function useUpdateWorkspace() {
  const { mutate, loading } = useMutation(settingsUpdateWorkspaceMutation)
  const { triggerNotification } = useGlobalToast()

  return {
    mutate: async (input: WorkspaceUpdateInput) => {
      const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

      if (result?.data) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Workspace updated'
        })
      } else {
        const errorMessage = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Workspace update failed',
          description: errorMessage
        })
      }

      return result
    },
    loading
  }
}
