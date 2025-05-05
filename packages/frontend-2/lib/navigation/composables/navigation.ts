import { setActiveWorkspaceMutation } from '~/lib/navigation/graphql/mutations'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { navigationActiveWorkspaceQuery } from '~/lib/navigation/graphql/queries'
import { graphql } from '~/lib/common/generated/gql'
import type { UseNavigationActiveWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseNavigationActiveWorkspace_Workspace on Workspace {
    ...HeaderWorkspaceSwitcherActiveWorkspace_Workspace
    id
  }
`)

export const useNavigationState = () =>
  useState<{
    activeWorkspaceSlug: string | null
    isProjectsActive: boolean
    cachedWorkspaceData: UseNavigationActiveWorkspace_WorkspaceFragment | null
  }>('navigation-state', () => ({
    activeWorkspaceSlug: null,
    isProjectsActive: false,
    cachedWorkspaceData: null
  }))

export const useNavigation = () => {
  const state = useNavigationState()
  const { mutate } = useMutation(setActiveWorkspaceMutation)
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const activeWorkspaceSlug = computed({
    get: () => state.value.activeWorkspaceSlug,
    set: (newVal) => (state.value.activeWorkspaceSlug = newVal)
  })

  const isProjectsActive = computed({
    get: () => state.value.isProjectsActive,
    set: (newVal) => (state.value.isProjectsActive = newVal)
  })

  const { result: activeWorkspaceResult, onResult } = useQuery(
    navigationActiveWorkspaceQuery,
    () => ({
      slug: activeWorkspaceSlug.value || ''
    }),
    () => ({
      enabled: !!activeWorkspaceSlug.value && isWorkspacesEnabled.value
    })
  )

  // Set state and mutate
  const mutateActiveWorkspaceSlug = async (newVal: string | null) => {
    state.value.activeWorkspaceSlug = newVal
    state.value.isProjectsActive = false
    await mutate({ slug: newVal, isProjectsActive: false })
  }

  const mutateIsProjectsActive = async (isActive: boolean) => {
    state.value.isProjectsActive = isActive
    state.value.activeWorkspaceSlug = null
    state.value.cachedWorkspaceData = null
    await mutate({ isProjectsActive: state.value.isProjectsActive, slug: null })
  }

  // Use the cached data or the current result
  const activeWorkspaceData = computed(() => {
    return (
      activeWorkspaceResult.value?.workspaceBySlug || state.value.cachedWorkspaceData
    )
  })

  // Save data in the state, the prevent flickering when the component remount in between navigation
  onResult((result) => {
    const workspace = result.data?.workspaceBySlug
    if (workspace) {
      state.value.cachedWorkspaceData = workspace
    }
  })

  return {
    activeWorkspaceSlug,
    isProjectsActive,
    mutateActiveWorkspaceSlug,
    mutateIsProjectsActive,
    activeWorkspaceData
  }
}
