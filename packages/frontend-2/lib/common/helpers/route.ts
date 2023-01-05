import { LocationQueryRaw } from 'vue-router'

export const homeRoute = '/'
export const loginRoute = '/auth/login'
export const registerRoute = '/auth/register'
export const forgottenPasswordRoute = '/auth/forgotten-password'
export const onboardingRoute = '/tour'
export const downloadManagerRoute = '/download-manager'
export const projectRoute = (id: string) => `/projects/${id}`
export const modelRoute = (projectId: string, modelId: string) =>
  `/projects/${projectId}/models/${modelId}`
export const modelVersionsRoute = (projectId: string, modelId: string) =>
  `/projects/${projectId}/models/${modelId}/versions`

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
