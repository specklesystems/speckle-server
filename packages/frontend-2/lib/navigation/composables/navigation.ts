import { setActiveWorkspaceMutation } from '~/lib/navigation/graphql/mutations'
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  navigationActiveWorkspaceQuery,
  navigationWorkspaceListQuery,
  useNavigationStateQuery
} from '~/lib/navigation/graphql/queries'
import { graphql } from '~/lib/common/generated/gql'
import type { UseNavigationActiveWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment UseNavigationState_User on User {
    id
    activeWorkspace {
      id
      slug
    }
    isProjectsActive
  }
`)

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
    cachedWorkspaceData: UseNavigationActiveWorkspace_WorkspaceFragment | null
  }>('navigation-state', () => ({
    cachedWorkspaceData: null
  }))

export const useNavigation = () => {
  const state = useNavigationState()
  const { mutate } = useMutation(setActiveWorkspaceMutation)
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const { result: workspacesResult } = useQuery(navigationWorkspaceListQuery, null, {
    enabled: isWorkspacesEnabled.value
  })

  const { result: navigationStateResult } = useQuery(useNavigationStateQuery, null, {
    enabled: isWorkspacesEnabled.value
  })

  const activeWorkspaceSlug = computed(
    () => navigationStateResult.value?.activeUser?.activeWorkspace?.slug || null
  )

  const isProjectsActive = computed(
    () => navigationStateResult.value?.activeUser?.isProjectsActive || false
  )

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
    await mutate({ slug: newVal, isProjectsActive: false })
  }

  const mutateIsProjectsActive = async (isActive: boolean) => {
    state.value.cachedWorkspaceData = null
    await mutate({ isProjectsActive: isActive, slug: null })
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
