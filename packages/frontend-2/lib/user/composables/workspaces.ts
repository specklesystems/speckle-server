import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { PagesOnboardingDiscoverableWorkspaces } from '~/lib/onboarding/graphql/queries'

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

export const useUserDiscoverableWorkspaces = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { result } = useQuery(PagesOnboardingDiscoverableWorkspaces, undefined, {
    enabled: isWorkspacesEnabled.value
  })

  const discoverableWorkspaces = computed(
    () => result.value?.activeUser?.discoverableWorkspaces || []
  )

  const discoverableWorkspacesCount = computed(
    () => discoverableWorkspaces.value.length
  )

  const hasDiscoverableWorkspaces = computed(
    () => discoverableWorkspaces.value.length > 0
  )

  return {
    discoverableWorkspaces,
    hasDiscoverableWorkspaces,
    discoverableWorkspacesCount
  }
}
