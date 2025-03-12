/**
 * Combined onboarding middleware that handles:
 * 1. Email verification redirect
 * 2. Segmentation questions redirect
 * 3. Workspace join/create redirect
 * 4. Redirect to the correct workspace
 */

import {
  homeRoute,
  verifyEmailRoute,
  onboardingRoute,
  workspaceCreateRoute,
  workspaceJoinRoute,
  projectsRoute,
  workspaceRoute
} from '~/lib/common/helpers/route'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import {
  activeUserWorkspaceExistenceCheckQuery,
  activeUserActiveWorkspaceCheckQuery
} from '~/lib/auth/graphql/queries'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { useNavigation } from '~/lib/navigation/composables/navigation'

export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  const isSSOPath = to.path.includes('/sso/')
  if (isAuthPage || isSSOPath) return

  const client = useApolloClientFromNuxt()
  const { activeWorkspaceSlug, isProjectsActive } = useNavigation()

  // Fetch required data
  const { data: serverInfoData } = await client
    .query({
      query: mainServerInfoDataQuery
    })
    .catch(convertThrowIntoFetchResult)

  const { data: userData } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // If user is not logged in, skip all checks
  if (!userData?.activeUser?.id) return

  const isEmailEnabled = serverInfoData?.serverInfo.configuration.isEmailEnabled

  // 1. Email verification redirect
  // Self hosters may not have emails enabled, so we skip the redirect
  const isVerifyEmailPage = to.path === verifyEmailRoute
  const hasUnverifiedEmails = userData.activeUser.emails.some(
    (email) => !email.verified
  )
  if (isEmailEnabled && hasUnverifiedEmails) {
    // Redirect to verification page if not already there
    if (!isVerifyEmailPage) {
      return navigateTo(verifyEmailRoute)
    }

    // Don't run any other checks if the user has unverified emails
    return
  }

  // 2. Segmentation questions redirect
  // isOnboardingFinished is set to true when the user has finished the onboarding process, or presses skip (if available)
  const isSegmentationFinished = userData.activeUser.isOnboardingFinished
  const isGoingToSegmentation = to.path === onboardingRoute

  if (!isSegmentationFinished && !isGoingToSegmentation) {
    return navigateTo(onboardingRoute)
  }

  if (isGoingToSegmentation && isSegmentationFinished) {
    return navigateTo(homeRoute)
  }

  // Don't run any other checks if the user has not finished the onboarding process
  if (!isSegmentationFinished) return

  // 3. Workspace join/create redirect
  // Everything past this point is only relevant for workspace enabled instances
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value || !isWorkspaceNewPlansEnabled.value) return

  const { data: workspaceExistenceData } = await client
    .query({
      query: activeUserWorkspaceExistenceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const workspaces = workspaceExistenceData?.activeUser?.workspaces?.items ?? []
  const hasWorkspaces = workspaces.length > 0
  const hasDiscoverableWorkspaces =
    (workspaceExistenceData?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (workspaceExistenceData?.activeUser?.workspaceJoinRequests?.totalCount ?? 0) > 0
  // If user has existing projects, we consider these legacy projects, and don't block app access yet
  const hasLegacyProjects =
    (workspaceExistenceData?.activeUser?.versions?.totalCount ?? 0) > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  // If user has discoverable workspaces, or has pending requests, go to join. Otherwise, we go to create.
  if (!hasWorkspaces && !hasLegacyProjects) {
    if (
      hasDiscoverableWorkspaces &&
      !isGoingToJoinWorkspace &&
      !isGoingToCreateWorkspace
    ) {
      return navigateTo(workspaceJoinRoute)
    }
    if (!hasDiscoverableWorkspaces && !isGoingToCreateWorkspace) {
      return navigateTo(workspaceCreateRoute())
    }
  }

  // 4. Redirect to the correct workspace
  // If there is an active workspace slug or legacy projects if active, we don't need to do anything
  if (activeWorkspaceSlug.value || isProjectsActive.value) return

  // Use Nuxt's useState to track if this is the initial load
  const isAppInitialized = useState<boolean>('app_initialized', () => false)

  // Skip workspace/project navigation logic if it's not the initial load
  if (isAppInitialized.value) return

  // Mark as initialized for future navigations
  isAppInitialized.value = true

  const { data: navigationCheckData } = await client
    .query({
      query: activeUserActiveWorkspaceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const activeUserIsProjectsActive = navigationCheckData?.activeUser?.isProjectsActive
  const activeUserActiveWorkspaceSlug =
    navigationCheckData?.activeUser?.activeWorkspace?.slug

  // 4.2 If going to legacy projects, set it active
  if (to.path === projectsRoute) {
    if (hasLegacyProjects) {
      isProjectsActive.value = true
    } else {
      if (hasWorkspaces) {
        activeWorkspaceSlug.value = workspaces[0].slug
        navigateTo(workspaceRoute(workspaces[0].slug))
      }
    }
    return
  }

  // 4.3 If going to workspace, set it active
  if (to.path.startsWith('/workspaces/')) {
    const belongsToWorkspace = workspaces.find(
      (workspace) => workspace.slug === to.params.slug
    )
    if (belongsToWorkspace) {
      const slug = to.params.slug as string
      activeWorkspaceSlug.value = slug
    }
    return
  }

  // 4.5 For all other routes, check for previous state
  if (activeUserActiveWorkspaceSlug) {
    activeWorkspaceSlug.value = activeUserActiveWorkspaceSlug
  } else if (activeUserIsProjectsActive) {
    isProjectsActive.value = true
  }

  if (to.path === homeRoute) {
    if (activeUserActiveWorkspaceSlug) {
      return navigateTo(workspaceRoute(activeUserActiveWorkspaceSlug))
    } else if (activeUserIsProjectsActive) {
      return navigateTo(projectsRoute)
    }
  }
})
