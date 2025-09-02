import { useApolloClient, useMutation } from '@vue/apollo-composable'
import {
  getFirstErrorMessage,
  modifyObjectField,
  getCacheId
} from '~/lib/common/helpers/graphql'
import type {
  DashboardCreateInput,
  DashboardUpdateInput,
  WorkspaceIdentifier
} from '~/lib/common/generated/gql/graphql'
import {
  createDashboardMutation,
  updateDashboardMutation,
  deleteDashboardMutation
} from '~/lib/dashboards/graphql/mutations'
import { useMixpanel } from '~/lib/core/composables/mp'

export function useCreateDashboard() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()
  const mixpanel = useMixpanel()

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
      mixpanel.track('Dashboard Created', {
        // eslint-disable-next-line camelcase
        workspace_id: res.data.dashboardMutations.create.workspace.id
      })
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

export function useUpdateDashboard() {
  const { mutate } = useMutation(updateDashboardMutation)
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  return async (input: DashboardUpdateInput, workspaceId: string) => {
    const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

    if (result?.data?.dashboardMutations.update) {
      mixpanel.track('Dashboard Updated', {
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Dashboard successfully updated'
      })
    } else {
      const err = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Dashboard update failed',
        description: err
      })
    }
  }
}

export function useDeleteDashboard() {
  const apollo = useApolloClient().client

  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  return async (id: string, workspaceId: string) => {
    const res = await apollo
      .mutate({
        mutation: deleteDashboardMutation,
        variables: { id },
        update: (cache, { data }) => {
          if (!data?.dashboardMutations?.delete) return

          cache.evict({ id: getCacheId('Dashboard', id) })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (res.data?.dashboardMutations.delete) {
      mixpanel.track('Dashboard Deleted', {
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Dashboard successfully deleted'
      })
    } else {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Dashboard deletion failed',
        description: err
      })
    }
  }
}
