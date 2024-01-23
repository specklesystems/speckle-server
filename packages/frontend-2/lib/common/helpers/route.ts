import type { LocationQueryRaw } from 'vue-router'
import { serializeHashState } from '~~/lib/common/composables/url'
import { ViewerHashStateKeys } from '~~/lib/viewer/composables/setup/urlHashState'

export const authBlockedDueToVerificationRoute = '/error-email-verify'
export const homeRoute = '/'
export const loginRoute = '/authn/login'
export const registerRoute = '/authn/register'
export const forgottenPasswordRoute = '/authn/forgotten-password'
export const onboardingRoute = '/onboarding'
export const downloadManagerRoute = '/download-manager'
export const serverManagementRoute = '/server-management'
export const projectRoute = (id: string) => `/projects/${id}`
export const modelRoute = (
  projectId: string,
  resourceIdString: string,
  hashState?: Partial<Record<ViewerHashStateKeys, string>>
) =>
  `/projects/${projectId}/models/${encodeURIComponent(resourceIdString)}${
    hashState ? serializeHashState(hashState) || '' : ''
  }`
export const modelVersionsRoute = (projectId: string, modelId: string) =>
  `/projects/${projectId}/models/${modelId}/versions`
export const allProjectModelsRoute = (projectId: string) =>
  `/projects/${projectId}/models`
export const projectDiscussionsRoute = (projectId: string) =>
  `/projects/${projectId}/discussions`
export const projectWebhooksRoute = (projectId: string) =>
  `/projects/${projectId}/webhooks`

export const automationDataPageRoute = (baseUrl: string, automationId: string) =>
  new URL(`/automations/${automationId}`, baseUrl).toString()

export const threadRedirectRoute = (projectId: string, threadId: string) =>
  `/projects/${projectId}/threads/${threadId}`

/**
 * TODO: Page doesn't exist
 */
export const userProfileRoute = (userId: string) => `/profile/${userId}`

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
