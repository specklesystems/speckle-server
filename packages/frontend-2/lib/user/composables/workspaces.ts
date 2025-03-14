import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'

export const useUserWorkspaces = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { result } = useQuery(settingsSidebarQuery, null, {
    enabled: isWorkspacesEnabled.value
  })

  const workspaces = computed(() =>
    result.value?.activeUser
      ? result.value.activeUser.workspaces.items.filter(
          (workspace) => workspace.creationState?.completed !== false
        )
      : []
  )

  const hasWorkspaces = computed(() => workspaces.value.length > 0)

  return {
    workspaces,
    hasWorkspaces
  }
}
