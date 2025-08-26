import { useApolloClient } from '@vue/apollo-composable'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import type {
  DashboardCreateInput,
  WorkspaceIdentifier
} from '~/lib/common/generated/gql/graphql'
import { createDashboardMutation } from '~/lib/dashboards/graphql/mutations'

export function useCreateDashboard() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  return async (options: {
    identifier: WorkspaceIdentifier
    input: DashboardCreateInput
  }) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { identifier, input } = options

    const res = await apollo
      .mutate({
        mutation: createDashboardMutation,
        variables: { workspace: identifier, input }
        // update: (cache, { data }) => {
        // const workspaceId = data?.workspaceMutations.create.id
        // if (!workspaceId) return
        // // Navigation to workspace is gonna fetch everything needed for the page, so we only
        // // really need to update workspace fields used in sidebar & settings: User.workspaces
        // modifyObjectField(
        //   cache,
        //   getCacheId('User', userId),
        //   'workspaces',
        //   ({ helpers: { createUpdatedValue, ref } }) => {
        //     return createUpdatedValue(({ update }) => {
        //       update('totalCount', (totalCount) => totalCount + 1)
        //       update('items', (items) => [...items, ref('Workspace', workspaceId)])
        //     })
        //   },
        //   {
        //     autoEvictFiltered: true
        //   }
        // )
        // }
      })
      .catch(convertThrowIntoFetchResult)

    if (res.data?.workspaceMutations.create.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace successfully created'
      })
    } else {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Workspace creation failed',
        description: err
      })
    }

    return res
  }
}
