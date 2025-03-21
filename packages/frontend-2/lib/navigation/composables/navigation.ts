import { setActiveWorkspaceMutation } from '~/lib/navigation/graphql/mutations'
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  navigationActiveWorkspaceQuery,
  navigationWorkspaceListQuery
} from '~/lib/navigation/graphql/queries'
import { graphql } from '~/lib/common/generated/gql'
import type { UseNavigationActiveWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseNavigationActiveWorkspace_Workspace on Workspace {
    ...HeaderWorkspaceSwitcherActiveWorkspace_Workspace
    id
  }
`)

graphql(`
  fragment UseNavigationWorkspaceList_User on User {
    id
    ...HeaderWorkspaceSwitcherWorkspaceList_User
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

  const { result: workspacesResult } = useQuery(navigationWorkspaceListQuery, null, {
    enabled: isWorkspacesEnabled.value
  })

  // Check for expired SSO sessions
  const expiredSsoSessions = computed(
    () => workspacesResult.value?.activeUser?.expiredSsoSessions || []
  )

  // Check if the current active workspace has an expired SSO session
  const activeWorkspaceHasExpiredSsoSession = computed(
    () =>
      !!expiredSsoSessions.value.find(
        (session) => session.slug === activeWorkspaceSlug.value
      )
  )

  const { result: activeWorkspaceResult, onResult } = useQuery(
    navigationActiveWorkspaceQuery,
    () => ({
      slug: activeWorkspaceSlug.value || ''
    }),
    () => ({
      enabled:
        !!activeWorkspaceSlug.value &&
        isWorkspacesEnabled.value &&
        !activeWorkspaceHasExpiredSsoSession.value
    })
  )

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

  // Active workspace where SSO session is expired
  const expiredSsoWorkspaceData = computed(() =>
    expiredSsoSessions.value.find(
      (session) => session.slug === activeWorkspaceSlug.value
    )
  )

  // Use the cached data or the current result
  const activeWorkspaceData = computed(() => {
    return (
      activeWorkspaceResult.value?.workspaceBySlug || state.value.cachedWorkspaceData
    )
  })

  const workspaceList = computed(() =>
    workspacesResult.value?.activeUser
      ? workspacesResult.value.activeUser.workspaces.items.filter(
          (workspace) => workspace.creationState?.completed !== false
        )
      : []
  )

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
    activeWorkspaceData,
    workspaceList,
    activeWorkspaceHasExpiredSsoSession,
    expiredSsoWorkspaceData
  }
}
