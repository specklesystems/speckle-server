import { blockedDomains } from '@speckle/shared'

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
    return (activeUser.value?.emails || [])
      .filter((email) => email.verified)
      .map((email) => email.email.split('@')[1])
      .filter(
        (domain) => domain && (!filterBlocked || !blockedDomains.includes(domain))
      )
  })

  return { domains }
}
