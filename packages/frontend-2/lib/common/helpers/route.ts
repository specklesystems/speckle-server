import type { LocationQueryRaw } from 'vue-router'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import { deserializeHashState, serializeHashState } from '~~/lib/common/composables/url'
import type { ViewerHashStateKeys } from '~~/lib/viewer/composables/setup/urlHashState'

export const profileRoute = '/profile'
export const authBlockedDueToVerificationRoute = '/error-email-verify'
export const homeRoute = '/'
export const loginRoute = '/authn/login'
export const registerRoute = '/authn/register'
export const forgottenPasswordRoute = '/authn/forgotten-password'
export const onboardingRoute = '/onboarding'
export const downloadManagerRoute = '/download-manager'
export const serverManagementRoute = '/server-management'
export const connectorsPageUrl = 'https://speckle.systems/features/connectors/'

export const projectRoute = (
  id: string,
  tab?: 'models' | 'discussions' | 'automations' | 'settings'
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

export const projectCollaboratorsRoute = (projectId: string) =>
  `/projects/${projectId}/settings/collaborators`

export const projectWebhooksRoute = (projectId: string) =>
  `/projects/${projectId}/settings/webhooks`

export const threadRedirectRoute = (projectId: string, threadId: string) =>
  `/projects/${projectId}/threads/${threadId}`

export const automateGithubAppAuthorizationRoute = '/api/automate/auth/githubapp'

export const automationFunctionsRoute = '/functions'

export const automationFunctionRoute = (functionId: string) =>
  `${automationFunctionsRoute}/${functionId}`

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
