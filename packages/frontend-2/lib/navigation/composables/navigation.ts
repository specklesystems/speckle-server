import { setActiveWorkspaceMutation } from '~/lib/navigation/graphql/mutations'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { headerWorkspaceSwitcherQuery } from '~/lib/navigation/graphql/queries'
import { graphql } from '~/lib/common/generated/gql'
import type { UseNavigation_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseNavigation_Workspace on Workspace {
    ...HeaderWorkspaceSwitcher_Workspace
    id
  }
`)

export const useNavigationState = () =>
  useState<{
    activeWorkspaceSlug: string | null
    isProjectsActive: boolean
    cachedWorkspaceData: UseNavigation_WorkspaceFragment | null
  }>('navigation-state', () => ({
    activeWorkspaceSlug: null,
    isProjectsActive: false,
    cachedWorkspaceData: null
  }))

export const useNavigation = () => {
  const state = useNavigationState()
  const { mutate } = useMutation(setActiveWorkspaceMutation)

  const activeWorkspaceSlug = computed({
    get: () => state.value.activeWorkspaceSlug,
    set: (newVal) => (state.value.activeWorkspaceSlug = newVal)
  })

  const {
    result,
    loading: workspaceLoading,
    onResult
  } = useQuery(
    headerWorkspaceSwitcherQuery,
    () => ({
      slug: activeWorkspaceSlug.value || ''
    }),
    () => ({
      enabled: !!activeWorkspaceSlug.value
    })
  )

  const isProjectsActive = computed({
    get: () => state.value.isProjectsActive,
    set: (newVal) => (state.value.isProjectsActive = newVal)
  })

  // Set state and mutate
  const mutateActiveWorkspaceSlug = async (newVal: string) => {
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
  const workspaceData = computed(() => {
    return result.value?.workspaceBySlug || state.value.cachedWorkspaceData
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
    workspaceData,
    workspaceLoading
  }
}
