import { LocationQueryRaw } from 'vue-router'

export const HomeRoute = '/'
export const LoginRoute = '/auth/login'
export const RegisterRoute = '/auth/register'
export const ForgottenPasswordRoute = '/auth/forgotten-password'
export const OnboardingRoute = '/onboarding'

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
export const useNavigateToForgottenPassword =
  buildNavigationComposable(ForgottenPasswordRoute)
