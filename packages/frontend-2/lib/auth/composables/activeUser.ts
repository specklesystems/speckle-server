import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import md5 from '~~/lib/common/helpers/md5'

export const activeUserQuery = graphql(`
  query ActiveUserMainMetadata {
    activeUser {
      id
      email
      name
      role
      avatar
      isOnboardingFinished
      createdAt
    }
  }
`)

/**
 * Get active user.
 * undefined - not yet resolved
 * null - resolved that user is a guest
 */
export function useActiveUser() {
  const { result, refetch, onResult } = useQuery(activeUserQuery)

  const activeUser = computed(() =>
    result.value ? result.value.activeUser : undefined
  )
  const isLoggedIn = computed(() => !!activeUser.value?.id)
  const distinctId = computed(() => {
    const user = activeUser.value
    if (!user) return user // null or undefined
    if (!user.email) return null

    return '@' + md5(user.email.toLowerCase()).toUpperCase()
  })

  return { activeUser, isLoggedIn, distinctId, refetch, onResult }
}

/**
 * Prevnets setup function from resolving until active user is resolved
 */
export async function useWaitForActiveUser() {
  const client = useApolloClient().client
  await client.query({ query: activeUserQuery }).catch(() => void 0)
}
