export const HomeRoute = '/'
export const LoginRoute = '/auth/login'
export const RegisterRoute = '/auth/register'

const buildNavigationComposable = (route: string) => () => {
  const router = useRouter()
  return () => router.push(route)
}

export const useNavigateToHome = buildNavigationComposable(HomeRoute)
export const useNavigateToLogin = buildNavigationComposable(LoginRoute)
export const useNavigateToRegistration = buildNavigationComposable(RegisterRoute)
