export const useApolloClientIfAvailable = () => {
  const nuxt = useNuxtApp()
  const getClient = () => (nuxt.$apollo?.default ? nuxt.$apollo.default : undefined)
  return getClient
}

export const useApolloClientFromNuxt = () => {
  const getClient = useApolloClientIfAvailable()
  const client = getClient()
  if (!client) {
    throw new Error("Apollo Client can't be resolved from NuxtApp yet")
  }

  return client
}
