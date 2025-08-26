import { useApolloClient } from '@vue/apollo-composable'
import {
  getFirstErrorMessage,
  modifyObjectField,
  getCacheId
} from '~/lib/common/helpers/graphql'
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
        variables: { workspace: identifier, input },
        update: (cache, { data }) => {
          const dashboardId = data?.dashboardMutations.create.id
          const workspaceId = data?.dashboardMutations.create.workspace.id
          if (!dashboardId || !workspaceId) return

          modifyObjectField(
            cache,
            getCacheId('Workspace', workspaceId),
            'dashboards',
            ({ helpers: { createUpdatedValue, ref } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => [ref('Dashboard', dashboardId), ...items])
              })
            },
            {
              autoEvictFiltered: true
            }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (res.data?.dashboardMutations.create) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Dashboard successfully created'
      })
    } else {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Dashboard creation failed',
        description: err
      })
    }

    return res
  }
}
