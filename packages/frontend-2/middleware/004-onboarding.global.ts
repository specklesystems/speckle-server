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
import { activeUserWorkspaceExistenceCheckQuery } from '~/lib/auth/graphql/queries'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  const isSSOPath = to.path.includes('/sso/')
  if (isAuthPage || isSSOPath) return

  const client = useApolloClientFromNuxt()

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
  if (isEmailEnabled) {
    const isVerifyEmailPage = to.path === verifyEmailRoute
    const hasUnverifiedEmails = userData.activeUser.emails.some(
      (email) => !email.verified
    )

    if (hasUnverifiedEmails) {
      if (!isVerifyEmailPage) {
        return navigateTo(verifyEmailRoute)
      }
    }
  }

  // 2. Segmentation questions redirect
  const isOnboardingFinished = userData.activeUser.isOnboardingFinished
  const isGoingToOnboarding = to.path === onboardingRoute

  if (!isOnboardingFinished && !isGoingToOnboarding) {
    return navigateTo(onboardingRoute)
  }

  if (isGoingToOnboarding && isOnboardingFinished) {
    return navigateTo(homeRoute)
  }

  // 3. Workspace join/create redirect
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value || !isWorkspaceNewPlansEnabled.value) return

  const { data: workspaceData } = await client
    .query({
      query: activeUserWorkspaceExistenceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const isMemberOfWorkspace =
    (workspaceData?.activeUser?.workspaces?.totalCount ?? 0) > 0
  const hasLegacyProjects = (workspaceData?.activeUser?.versions?.totalCount ?? 0) > 0
  const hasDiscoverableWorkspaces =
    (workspaceData?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (workspaceData?.activeUser?.workspaceJoinRequests?.totalCount ?? 0) > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!isMemberOfWorkspace && !hasLegacyProjects) {
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
})
