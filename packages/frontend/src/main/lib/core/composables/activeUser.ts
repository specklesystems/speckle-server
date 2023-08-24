import { MainUserDataDocument } from '@/graphql/generated/graphql'
import { md5 } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import { isAdmin, isGuest } from '@/main/lib/core/helpers/users'

/**
 * Get active user.
 * undefined - not yet resolved
 * null - resolved that user is a guest
 */
export function useActiveUser() {
  const { result, refetch, onResult } = useQuery(MainUserDataDocument)

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

  const isAdminUser = computed(() => isAdmin(activeUser.value))
  const isServerGuest = computed(() => isGuest(activeUser.value))

  return {
    activeUser,
    isLoggedIn,
    distinctId,
    refetch,
    onResult,
    isAdmin: isAdminUser,
    isServerGuest
  }
}
