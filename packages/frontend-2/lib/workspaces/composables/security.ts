import { blockedDomains } from '@speckle/shared'
import { sortBy } from 'lodash-es'

export const useVerifiedUserEmailDomains = (
  options?: Partial<{
    /**
     * Whether to filter out blocked domains from the list
     */
    filterBlocked: boolean
  }>
) => {
  const { filterBlocked = true } = options || {}
  const { activeUser } = useActiveUser()

  const domains = computed(() => {
    return sortBy(
      (activeUser.value?.emails || []).filter((email) => email.verified),
      (email) => !email.primary
    )
      .map((email) => email.email.split('@')[1])
      .filter(
        (domain) => domain && (!filterBlocked || !blockedDomains.includes(domain))
      )
  })

  return { domains }
}
