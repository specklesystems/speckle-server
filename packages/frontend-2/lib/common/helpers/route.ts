import { LocationQueryRaw } from 'vue-router'

export const HomeRoute = '/'
export const LoginRoute = '/auth/login'
export const RegisterRoute = '/auth/register'

const buildNavigationComposable = (route: string) => () => {
  const router = useRouter()
  return (params?: { query?: LocationQueryRaw }) => {
    const { query } = params || {}
    return router.push({ path: route, query })
  }
}

export const useNavigateToHome = buildNavigationComposable(HomeRoute)
export const useNavigateToLogin = buildNavigationComposable(LoginRoute)
export const useNavigateToRegistration = buildNavigationComposable(RegisterRoute)
