export const HomeRoute = '/'

export function useNavigateToHome() {
  const router = useRouter()
  return () => router.push(HomeRoute)
}
