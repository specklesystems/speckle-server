export const useAuthPolicies = () => {
  const nuxt = useNuxtApp()
  return nuxt.$authPolicies
}
