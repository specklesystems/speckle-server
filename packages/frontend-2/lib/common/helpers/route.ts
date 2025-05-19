import type { LocationQueryRaw } from 'vue-router'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import { deserializeHashState, serializeHashState } from '~~/lib/common/composables/url'
import type { ViewerHashStateKeys } from '~~/lib/viewer/composables/setup/urlHashState'

export const profileRoute = '/profile'
export const authBlockedDueToVerificationRoute = '/error-email-verify'
export const homeRoute = '/'
export const projectsRoute = '/projects'
export const loginRoute = '/authn/login'
export const registerRoute = '/authn/register'
export const ssoLoginRoute = '/authn/sso'
export const forgottenPasswordRoute = '/authn/forgotten-password'
export const verifyEmailRoute = '/verify-email'
export const verifyEmailCountdownRoute = '/verify-email?source=registration'
export const serverManagementRoute = '/server-management'
export const connectorsRoute = '/connectors'
export const tutorialsRoute = '/tutorials'
export const docsPageUrl = 'https://speckle.guide/'
export const forumPageUrl = 'https://speckle.community/'
export const defaultZapierWebhookUrl =
  'https://hooks.zapier.com/hooks/catch/12120532/2m4okri/'
export const guideBillingUrl = 'https://speckle.guide/workspaces/billing.html'
export const bookDemoRoute = '/book-a-demo'
export const onboardingRoute = '/onboarding'

export const settingsUserRoutes = {
  profile: '/settings/user/profile',
  notifications: '/settings/user/notifications',
  developerSettings: '/settings/user/developer',
  emails: '/settings/user/emails'
}

export const settingsServerRoutes = {
  general: '/settings/server/general',
  projects: '/settings/server/projects',
  members: '/settings/server/members',
  regions: '/settings/server/regions'
}

export const settingsWorkspaceRoutes = {
  general: {
    name: 'settings-workspaces-slug-general',
    route: (slug?: string) => `/settings/workspaces/${slug}/general`
  },
  members: {
    name: 'settings-workspaces-slug-members',
    route: (slug?: string) => `/settings/workspaces/${slug}/members`
  },
  membersGuests: {
    name: 'settings-workspaces-slug-members-guests',
    route: (slug?: string) => `/settings/workspaces/${slug}/members/guests`
  },
  membersInvites: {
    name: 'settings-workspaces-slug-members-invites',
    route: (slug?: string) => `/settings/workspaces/${slug}/members/invites`
  },
  membersRequests: {
    name: 'settings-workspaces-slug-members-requests',
    route: (slug?: string) => `/settings/workspaces/${slug}/members/requests`
  },
  projects: {
    name: 'settings-workspaces-slug-projects',
    route: (slug?: string) => `/settings/workspaces/${slug}/projects`
  },
  security: {
    name: 'settings-workspaces-slug-security',
    route: (slug?: string) => `/settings/workspaces/${slug}/security`
  },
  billing: {
    name: 'settings-workspaces-slug-billing',
    route: (slug?: string) => `/settings/workspaces/${slug}/billing`
  },
  regions: {
    name: 'settings-workspaces-slug-regions',
    route: (slug?: string) => `/settings/workspaces/${slug}/regions`
  }
}

export const projectRoute = (
  id: string,
  tab?: 'models' | 'discussions' | 'automations' | 'collaborators' | 'settings'
) => {
  let res = `/projects/${id}`
  if (tab && tab !== 'models') {
    res += `/${tab}`
  }

  return res
}
export const projectAutomationRoute = (projectId: string, automationId: string) => {
  return `${projectRoute(projectId, 'automations')}/${automationId}`
}

export const modelRoute = (
  projectId: string,
  resourceIdString: string,
  hashState?: Partial<Record<ViewerHashStateKeys, string>>
) =>
  `/projects/${projectId}/models/${resourceIdString}${
    hashState ? serializeHashState(hashState) || '' : ''
  }`
export const modelVersionsRoute = (projectId: string, modelId: string) =>
  `/projects/${projectId}/models/${modelId}/versions`

// Temp change to allProjectModelsRoute until tab routing is implemented
export const allProjectModelsRoute = (projectId: string) => `/projects/${projectId}`

// Temp change to projectDiscussionsRoute until tab routing is implemented
export const projectDiscussionsRoute = (projectId: string) => `/projects/${projectId}`

export const projectSettingsRoute = (projectId: string) =>
  `/projects/${projectId}/settings`

export const projectWebhooksRoute = (projectId: string) =>
  `/projects/${projectId}/settings/webhooks`

export const threadRedirectRoute = (projectId: string, threadId: string) =>
  `/projects/${projectId}/threads/${threadId}`

export const automateGithubAppAuthorizationRoute = (workspaceSlug?: string) => {
  return `/api/automate/auth/githubapp${
    workspaceSlug ? `?workspaceSlug=${workspaceSlug}` : ''
  }`
}

export const publicAutomateFunctionsRoute = '/functions'

export const automateFunctionRoute = (functionId: string) =>
  `${publicAutomateFunctionsRoute}/${functionId}`

export const workspaceRoute = (slug?: string) => `/workspaces/${slug}`
export const workspaceSsoRoute = (slug: string) => `/workspaces/${slug}/sso`

export const workspaceCreateRoute = '/workspaces/actions/create'

export const workspaceJoinRoute = '/workspaces/actions/join'

export const workspaceFunctionsRoute = (slug: string) => `/workspaces/${slug}/functions`

const buildNavigationComposable = (route: string) => () => {
  const router = useRouter()
  return (params?: { query?: LocationQueryRaw }) => {
    const { query } = params || {}
    return router.push({ path: route, query })
  }
}

export const useNavigateToHome = buildNavigationComposable(homeRoute)
export const useNavigateToLogin = buildNavigationComposable(loginRoute)
export const useNavigateToRegistration = buildNavigationComposable(registerRoute)
export const useNavigateToForgottenPassword =
  buildNavigationComposable(forgottenPasswordRoute)

export const useNavigateToProject = () => {
  const router = useRouter()
  return (params: { query?: LocationQueryRaw; id: string }) => {
    const { query, id } = params || {}
    return router.push({ path: projectRoute(id), query })
  }
}

export const useRememberRouteAndGoToLogin = () => {
  const goToLogin = useNavigateToLogin()
  const postAuthRedirect = usePostAuthRedirect()

  return async (...params: Parameters<typeof goToLogin>) => {
    postAuthRedirect.setCurrentRoute()
    return goToLogin(...params)
  }
}

/**
 * Check that fullPathA fits fullPathB (not necessarily the inverse)
 */
export const doesRouteFitTarget = (fullPathA: string, fullPathB: string) => {
  const fakeOrigin = 'https://test.com'

  let urlA: URL
  let urlB: URL

  try {
    urlA = new URL(fullPathA, fakeOrigin)
    urlB = new URL(fullPathB, fakeOrigin)
  } catch (e) {
    useLogger().warn('Failed to parse URLs', e)
    return false
  }

  if (urlA.pathname !== urlB.pathname) {
    return false
  }

  const queryKeysA = urlA.searchParams.keys()
  for (const key of queryKeysA) {
    if (urlB.searchParams.get(key) !== urlA.searchParams.get(key)) {
      return false
    }
  }

  const hashA = deserializeHashState(urlA.hash)
  const hashB = deserializeHashState(urlB.hash)
  for (const [key, value] of Object.entries(hashA)) {
    if (hashB[key] !== value) {
      return false
    }
  }

  return true
}

// Link to Workspace roles and seats documentation
// TODO: Add link when ready
export const LearnMoreRolesSeatsUrl = 'https://speckle.guide/'
export const LearnMoreMoveProjectsUrl = 'https://speckle.systems/pricing'
