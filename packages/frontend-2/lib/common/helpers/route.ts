import { LocationQueryRaw } from 'vue-router'

export const homeRoute = '/'
export const loginRoute = '/authn/login'
export const registerRoute = '/authn/register'
export const forgottenPasswordRoute = '/authn/forgotten-password'
export const onboardingRoute = '/onboarding'
export const downloadManagerRoute = '/download-manager'
export const projectRoute = (id: string) => `/projects/${id}`
export const modelRoute = (projectId: string, resourceIdString: string) =>
  `/projects/${projectId}/models/${encodeURIComponent(resourceIdString)}`
export const modelVersionsRoute = (projectId: string, modelId: string) =>
  `/projects/${projectId}/models/${modelId}/versions`

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
