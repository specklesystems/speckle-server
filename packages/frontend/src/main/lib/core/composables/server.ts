import { MainServerInfoDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'

export function useServerInfo() {
  const { result } = useQuery(MainServerInfoDocument)

  const serverInfo = computed(() => result.value?.serverInfo)
  const isGuestMode = computed(() => !!serverInfo.value?.guestModeEnabled)

  return { serverInfo, isGuestMode }
}
