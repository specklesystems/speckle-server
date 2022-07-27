import { IsLoggedInDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'

/**
 * Composable that resolves whether the user is logged in through an Apollo query
 */
export function useIsLoggedIn() {
  const { result } = useQuery(IsLoggedInDocument)
  const isLoggedIn = computed(() => !!result.value?.user?.id)
  return { isLoggedIn }
}
