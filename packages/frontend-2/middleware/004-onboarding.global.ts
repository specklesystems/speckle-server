/**
 * Combined onboarding middleware that handles:
 * 1. Email verification redirect
 * 2. Segmentation questions redirect
 * 3. Workspace join/create redirect
 */

import {
  homeRoute,
  verifyEmailRoute,
  onboardingRoute,
  workspaceCreateRoute,
  workspaceJoinRoute
} from '~/lib/common/helpers/route'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { buildActiveUserWorkspaceExistenceCheckQuery } from '~/lib/workspaces/helpers/middleware'
import { useMiddlewareQueryFetchPolicy } from '~/lib/core/composables/navigation'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const isAuthPage = to.path.startsWith('/authn/')
  const isSSOPath = to.path.includes('/sso/')
  if (isAuthPage || isSSOPath) return

  const client = useApolloClientFromNuxt()
  const fetchPolicy = useMiddlewareQueryFetchPolicy()

  // Fetch required data
  const [{ data: serverInfoData }, { data: userData }] = await Promise.all([
    client
      .query({
        query: mainServerInfoDataQuery
      })
      .catch(convertThrowIntoFetchResult),
    client
      .query({
        query: activeUserQuery,
        fetchPolicy: fetchPolicy(to, from)
      })
      .catch(convertThrowIntoFetchResult)
  ])

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
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value) return

  const { data: workspaceExistenceData } = await client
    .query({
      ...buildActiveUserWorkspaceExistenceCheckQuery(),
      fetchPolicy: fetchPolicy(to, from)
    })
    .catch(convertThrowIntoFetchResult)

  const workspaces = workspaceExistenceData?.activeUser?.workspaces?.items ?? []
  const hasWorkspaces = workspaces.length > 0
  const hasDiscoverableWorkspaces =
    (workspaceExistenceData?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (workspaceExistenceData?.activeUser?.workspaceJoinRequests?.totalCount ?? 0) > 0
  // If user has existing projects, we consider these legacy projects, and don't block app access yet
  const hasLegacyProjects =
    (workspaceExistenceData?.activeUser?.projects?.totalCount ?? 0) > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute

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
      return navigateTo(workspaceCreateRoute)
    }
  }
})
